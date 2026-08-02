import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  Paperclip,
  FileText,
  Download,
  Users,
  X,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sendNotification } from "../lib/notifications";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
}

interface GroupInfo {
  id: string;
  name: string;
  participants: string[];
  created_by: string;
}

export default function ChatView() {
  const { channelName, userId: dmUserId, groupId } = useParams();
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [headerTitle, setHeaderTitle] = useState("");
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isChannel = !!channelName;
  const isGroup = !!groupId;

  useEffect(() => {
    if (!user || !supabase) return;

    const findOrCreate = async () => {
      let convId: string | null = null;
      let title = "";

      if (channelName) {
        const { data: conv } = await supabase
          .from("conversations")
          .select("id")
          .eq("type", "channel")
          .eq("channel_name", channelName)
          .single();
        if (conv) {
          convId = conv.id;
          title = `#${channelName}`;
        }
      } else if (groupId) {
        const { data: conv } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", groupId)
          .single();
        if (conv) {
          convId = conv.id;
          title = conv.name || "Group";
          setGroupInfo(conv as GroupInfo);
        }
      } else if (dmUserId) {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("type", "direct")
          .contains("participants", [user.id, dmUserId])
          .maybeSingle();

        if (existing) {
          convId = existing.id;
        } else {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({
              type: "direct",
              participants: [user.id, dmUserId],
            })
            .select("id")
            .single();
          if (newConv) convId = newConv.id;
        }

        const { data: otherProfile } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("user_id", dmUserId)
          .single();
        title = otherProfile?.display_name || dmUserId.slice(0, 8);
      }

      if (convId) {
        setConversationId(convId);
        setHeaderTitle(title);
      }
    };

    findOrCreate();
  }, [channelName, dmUserId, groupId, user?.id, supabase]);

  useEffect(() => {
    if (!conversationId || !supabase) return;

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data as Message[]);
        const senderIds = [...new Set(data.map((m: Message) => m.sender_id))];
        const names: Record<string, string> = {};
        await Promise.all(
          senderIds.map(async (sid) => {
            if (sid === user?.id) {
              names[sid] = "You";
              return;
            }
            const { data: prof } = await supabase
              .from("user_profiles")
              .select("display_name")
              .eq("user_id", sid)
              .single();
            names[sid] = prof?.display_name || sid.slice(0, 8);
          })
        );
        setSenderNames(names);
      }
    };

    load();

    if (user) {
      supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false)
        .then(() => {});
    }

    const sub = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (
            newMsg.sender_id !== user?.id &&
            !senderNames[newMsg.sender_id]
          ) {
            supabase
              .from("user_profiles")
              .select("display_name")
              .eq("user_id", newMsg.sender_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setSenderNames((prev) => ({
                    ...prev,
                    [newMsg.sender_id]: data.display_name,
                  }));
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [conversationId, user?.id, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (attachment?: {
    url: string;
    type: string;
    name: string;
    size: number;
  }) => {
    if ((!input.trim() && !attachment) || !conversationId || !user || !supabase) return;

    const payload: Record<string, unknown> = {
      sender_id: user.id,
      conversation_id: conversationId,
      content: attachment ? (input.trim() || "") : input.trim(),
    };

    if (attachment) {
      payload.attachment_url = attachment.url;
      payload.attachment_type = attachment.type;
      payload.attachment_name = attachment.name;
      payload.attachment_size = attachment.size;
    }

    const { error } = await supabase.from("messages").insert(payload);

    if (!error) {
      setInput("");

      // Notify DM recipients
      if (dmUserId && !channelName && !isGroup) {
        sendNotification(supabase, {
          userId: dmUserId,
          type: "message",
          title: "New message",
          body: attachment
            ? `Sent a ${attachment.type.startsWith("image") ? "photo" : "file"}`
            : input.trim().slice(0, 120),
          link: `/dm/${user.id}`,
          fromUserId: user.id,
        });
      } else if (isGroup && groupInfo) {
        // Notify all group members except sender
        groupInfo.participants.forEach((pid) => {
          if (pid !== user.id) {
            sendNotification(supabase, {
              userId: pid,
              type: "message",
              title: groupInfo.name,
              body: attachment
                ? `Sent a ${attachment.type.startsWith("image") ? "photo" : "file"}`
                : input.trim().slice(0, 120),
              link: `/group/${groupId}`,
              fromUserId: user.id,
            });
          }
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("chat_attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat_attachments").getPublicUrl(filePath);

      const isImage = file.type.startsWith("image/");

      await sendMessage({
        url: publicUrl,
        type: isImage ? "image" : "file",
        name: file.name,
        size: file.size,
      });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 lg:px-4 py-3 border-b border-border bg-panel flex items-center gap-2 shrink-0">
        {/* Back button (mobile) */}
        <button
          onClick={() => navigate(-1)}
          className="lg:hidden text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-sm font-medium text-foreground truncate flex-1">
          {headerTitle}
        </h2>
        {isGroup && groupInfo && (
          <button
            onClick={() => setShowGroupMembers(!showGroupMembers)}
            className="text-muted hover:text-accent transition-colors duration-150 cursor-pointer flex items-center gap-1"
            title="Group members"
          >
            <Users size={14} />
            <span className="text-xs hidden sm:inline">
              {groupInfo.participants.length}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto scroll-thin p-3 lg:p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted">
                  No messages yet. Say hello!
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === user?.id}
                senderName={
                  senderNames[msg.sender_id] || msg.sender_id.slice(0, 8)
                }
              />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-2 lg:p-3 bg-panel">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-background border border-border rounded flex items-end">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isChannel
                      ? `Message #${channelName}`
                      : isGroup
                        ? `Message ${headerTitle}`
                        : "Message..."
                  }
                  maxLength={2000}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-muted hover:text-accent transition-colors duration-150 cursor-pointer disabled:opacity-30 shrink-0"
                  title="Attach file"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip size={16} />
                  )}
                </button>
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() && !uploading}
                className="bg-accent text-white rounded p-2 hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97] cursor-pointer shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-right text-[10px] text-muted mt-1">
              {input.length}/2000
            </div>
          </div>
        </div>

        {/* Group members sidebar */}
        {isGroup && showGroupMembers && groupInfo && supabase && (
          <GroupMembersSidebar
            groupInfo={groupInfo}
            currentUserId={user?.id || ""}
            onClose={() => setShowGroupMembers(false)}
            onMembersChanged={() => {
              // Reload group info
              if (groupId) {
                supabase
                  .from("conversations")
                  .select("*")
                  .eq("id", groupId)
                  .single()
                  .then(({ data }) => {
                    if (data) setGroupInfo(data as GroupInfo);
                  });
              }
            }}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.txt,.zip,.json,.csv"
      />
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  senderName,
}: {
  message: Message;
  isOwn: boolean;
  senderName: string;
}) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-3 py-2 shadow-sm ${
          isOwn ? "bubble-out" : "bubble-in"
        }`}
      >
        {!isOwn && (
          <div className="text-xs text-accent mb-1 font-medium">
            {senderName}
          </div>
        )}

        {/* Attachment */}
        {message.attachment_url && (
          <div className="mb-2">
            {message.attachment_type === "image" ? (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name || "Image"}
                  className="max-w-full rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              </a>
            ) : (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded-xl p-2 hover:opacity-90 transition-opacity ${
                  isOwn ? "bg-white/15" : "bg-background/70"
                }`}
              >
                <FileText size={16} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate">{message.attachment_name || "File"}</p>
                  {message.attachment_size && (
                    <p className="text-[10px] opacity-70">
                      {formatFileSize(message.attachment_size)}
                    </p>
                  )}
                </div>
                <Download size={14} className="shrink-0 opacity-70" />
              </a>
            )}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}

        <div
          className={`text-[10px] text-right mt-1 ${
            isOwn ? "text-white/70" : "text-muted"
          }`}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

function GroupMembersSidebar({
  groupInfo,
  currentUserId,
  onClose,
  onMembersChanged,
}: {
  groupInfo: GroupInfo;
  currentUserId: string;
  onClose: () => void;
  onMembersChanged: () => void;
}) {
  const { supabase } = useAuth();
  const [members, setMembers] = useState<
    { user_id: string; display_name: string }[]
  >([]);

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupInfo.participants]);

  const loadMembers = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", groupInfo.participants);

    if (data) {
      // Preserve the order from participants
      const ordered = groupInfo.participants
        .map((pid) => data.find((m) => m.user_id === pid))
        .filter(Boolean) as { user_id: string; display_name: string }[];
      setMembers(ordered);
    }
  };

  const removeMember = async (userId: string) => {
    if (!supabase) return;
    const updated = groupInfo.participants.filter((p) => p !== userId);
    const { error } = await supabase
      .from("conversations")
      .update({ participants: updated })
      .eq("id", groupInfo.id);

    if (!error) {
      onMembersChanged();
    }
  };

  const leaveGroup = async () => {
    if (!supabase) return;
    const updated = groupInfo.participants.filter((p) => p !== currentUserId);
    // If last person, delete the conversation
    if (updated.length === 0) {
      await supabase.from("conversations").delete().eq("id", groupInfo.id);
    } else {
      await supabase
        .from("conversations")
        .update({ participants: updated })
        .eq("id", groupInfo.id);
    }
    window.location.href = "/";
  };

  const isCreator = groupInfo.created_by === currentUserId;

  return (
    <div className="w-56 lg:w-64 border-l border-border bg-panel flex flex-col overflow-hidden shrink-0">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          Members ({members.length})
        </span>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin p-2 space-y-1">
        {members.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-foreground"
          >
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent shrink-0">
              {m.display_name.charAt(0).toUpperCase()}
            </div>
            <span className="truncate flex-1">{m.display_name}</span>
            {m.user_id === groupInfo.created_by && (
              <span className="text-[10px] text-accent">admin</span>
            )}
            {isCreator && m.user_id !== currentUserId && (
              <button
                onClick={() => removeMember(m.user_id)}
                className="text-muted hover:text-destructive transition-colors duration-150 cursor-pointer"
                title="Remove"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-border">
        <button
          onClick={leaveGroup}
          className="w-full text-xs text-destructive hover:text-destructive/80 px-2 py-1.5 rounded transition-colors duration-150 cursor-pointer"
        >
          Leave group
        </button>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
