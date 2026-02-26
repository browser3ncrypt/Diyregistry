import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
  async email(message, env, ctx) {
    // Optional: Add logic to detect signup intent (e.g., subject contains "subscribe" or specific keyword in body)
    // For simplicity, this replies to every incoming message; refine as required.

    // Create the reply message
    const reply = createMimeMessage();
    
    // Set In-Reply-To header for proper threading in the recipient's inbox
    reply.setHeader("In-Reply-To", message.headers.get("Message-ID"));
    
    // Sender must use a verified address on your domain (e.g., no-reply@yourdomain.com)
    reply.setSender({
      name: "Your Notifications Service",
      addr: "no-reply@yourdomain.com"  // Replace with your verified sender address
    });
    
    reply.setRecipient(message.from);
    reply.setSubject("Confirmation: Email Notifications Activated");
    
    // Add plain-text body (you can add HTML via addMessage with contentType: 'text/html')
    reply.addMessage({
      contentType: "text/plain",
      data: `Thank you for signing up for email notifications!

Your request has been received from ${message.from}.
You will now receive updates as configured.

If this was unintentional, please reply to this message or contact support@yourdomain.com.

Best regards,
Your Team`
    });

    // Construct the EmailMessage object for reply
    const replyMessage = new EmailMessage(
      "no-reply@yourdomain.com",  // Must match sender domain
      message.from,
      reply.asRaw()
    );

    // Send the auto-reply
    await message.reply(replyMessage);

    // Optional: Forward original message to your inbox for record-keeping
    await message.forward("your-inbox@yourdomain.com");  // Replace with verified destination

    // Optional: Prevent default forwarding if not needed
    // message.setReject("Handled via auto-reply"); // Use only if you do NOT want to forward
  }
};