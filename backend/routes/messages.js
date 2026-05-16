import { Router } from 'express';
import { ObjectId } from 'mongodb';

export function createMessagesRoutes(db) {
  const router = Router();
  const messagesCollection = db.collection('messages');
  const conversationsCollection = db.collection('conversations');

  // Get messages for a conversation
  router.get('/conversation/:conversationId', async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      if (!conversationId || conversationId === 'undefined') {
        return res.status(400).json({ error: 'Conversation ID required' });
      }

      // Fetch messages for this conversation
      const messages = await messagesCollection
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .toArray();

      // Reverse to get chronological order (oldest first)
      const orderedMessages = messages.reverse().map(msg => ({
        id: msg._id?.toString() || msg._id,
        from: msg.senderFirebaseUID === (req.user?.uid) ? 'me' : 'them',
        text: msg.text || '',
        time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        media: msg.media,
        mediaType: msg.mediaType,
      }));

      return res.json({
        conversationId,
        messages: orderedMessages,
        count: messages.length,
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Get or create conversation between two users
  router.post('/conversation', async (req, res) => {
    try {
      const { userId1, userId2, user1Email, user2Email } = req.body;

      if (!userId1 || !userId2) {
        return res.status(400).json({ error: 'Both user IDs required' });
      }

      // Create a consistent conversation ID
      const sortedIds = [userId1, userId2].sort();
      const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;

      // Try to find existing conversation
      let conversation = await conversationsCollection.findOne({ conversationId });

      if (!conversation) {
        // Create new conversation
        conversation = {
          conversationId,
          participants: [
            { uid: userId1, email: user1Email },
            { uid: userId2, email: user2Email },
          ],
          lastMessage: null,
          lastMessageTime: new Date(),
          createdAt: new Date(),
        };

        const result = await conversationsCollection.insertOne(conversation);
        conversation._id = result.insertedId;
      }

      return res.json({
        conversationId,
        _id: conversation._id?.toString(),
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Send a message (HTTP endpoint, mainly for testing)
  router.post('/send', async (req, res) => {
    try {
      const { conversationId, senderFirebaseUID, text, media, mediaType } = req.body;

      if (!conversationId || !senderFirebaseUID || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const message = {
        conversationId,
        senderFirebaseUID,
        text,
        media: media || null,
        mediaType: mediaType || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await messagesCollection.insertOne(message);

      // Update conversation with last message
      await conversationsCollection.updateOne(
        { conversationId },
        {
          $set: {
            lastMessage: text,
            lastMessageTime: new Date(),
          },
        }
      );

      return res.json({
        _id: result.insertedId,
        ...message,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}
