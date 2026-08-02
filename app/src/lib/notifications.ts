import { SupabaseClient } from "@supabase/supabase-js";

interface SendNotificationParams {
  userId: string; // recipient
  type: "friend_request" | "message" | "reaction" | "system";
  title: string;
  body?: string;
  link?: string;
  fromUserId?: string;
}

export async function sendNotification(
  supabase: SupabaseClient,
  { userId, type, title, body = "", link, fromUserId }: SendNotificationParams
) {
  // Don't send notification to yourself
  if (fromUserId === userId) return;

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    link,
    from_user_id: fromUserId,
  });
}
