import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, storage } from './firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  setDoc,
  limit, 
  getDocs, 
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ReportModal from './ReportModal';
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import './css/Chat.css';
import defaultProfilePic from './assets/default-profile-pic.jpg';

const gf = new GiphyFetch('XZNhdoMkAXOzJ60KoqCHuP849vyYlhAP');

function Chat({ currentUser }) {
  const { id: receiverId } = useParams();
  const [receiverName, setReceiverName] = useState('');
  const [receiverInterests, setReceiverInterests] = useState('');
  const [receiverPhoto, setReceiverPhoto] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGifs, setShowGifs] = useState(false);
  const [gifKey, setGifKey] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState(null);
const [showReportModal, setShowReportModal] = useState(false);
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
console.log('Receiver ID från useParams:', receiverId);

  const chatId = [currentUser.uid, receiverId].sort().join('_');
  const navigate = useNavigate();

  const latestSearchTerm = useRef('');

useEffect(() => {
  const markLastMessageAsRead = async () => {
    if (!currentUser || !receiverId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    const summaryRef = doc(db, 'chatSummaries', chatId);
const summarySnap = await getDoc(summaryRef);
if (summarySnap.exists()) {
  const summaryData = summarySnap.data();
  const updatedUnreadBy = summaryData.unreadBy?.filter(uid => uid !== currentUser.uid) || [];
  await updateDoc(summaryRef, { unreadBy: updatedUnreadBy });
}

    if (!snapshot.empty) {
      const lastMsgDoc = snapshot.docs[0];
      const lastMsg = lastMsgDoc.data();

      if (lastMsg.senderId !== currentUser.uid && !lastMsg.isRead) {
        await updateDoc(lastMsgDoc.ref, { isRead: true });
      }
    }
  };

  markLastMessageAsRead();
}, [currentUser, receiverId, chatId]);

  useEffect(() => {
    const fetchReceiverData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', receiverId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setReceiverName(data.name);
          setReceiverPhoto(data.photoURL  || defaultProfilePic);
          setReceiverInterests(data.interests);
        } else {
          setReceiverName('Okänd användare');
        }
      } catch (error) {
        console.error('Kunde inte hämta användardata:', error);
        setReceiverName('Okänd användare');
      }
    };
    fetchReceiverData();
  }, [receiverId]);

  useEffect(() => {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (searchTerm.trim()) {
      setShowGifs(true);
      setGifKey((prev) => prev + 1);
    } else {
      setShowGifs(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

const submitReport = async (reason) => {
  try {
    await addDoc(collection(db, 'reports'), {
      reportedBy: currentUser.uid,
      reportedUserId: receiverId,
      reason,
      chatId,
      timestamp: serverTimestamp(),
    });
    alert('Tack! Din rapport har skickats.');
  } catch (error) {
    console.error('Fel vid rapportering:', error.message, error);
    alert('Något gick fel: ' + error.message);
  } finally {
    setShowReportModal(false);
  }
};

const handleReportUser = () => {
  setShowReportModal(true);
};
  const sendMessage = async (e) => {
    e.preventDefault();
  if (!newMessage.trim()) return;

  const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const recipientDoc = await getDoc(doc(db, 'users', receiverId));

  if (!currentUserDoc.exists() || !recipientDoc.exists()) return;

  const currentUserData = currentUserDoc.data();
  const recipientData = recipientDoc.data();

  const youBlocked = currentUserData.blockedUsers?.includes(receiverId);
  const theyBlocked = recipientData.blockedUsers?.includes(currentUser.uid);

  if (youBlocked) {
    alert("Du har blockerat denna användare.");
    return;
  }
  if (theyBlocked) {
    alert("Du kan inte skicka meddelanden till denna användare.");
    return;
  }
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        type: 'text',
      });
      await setDoc(doc(db, 'chatSummaries', chatId), {
        participants: [currentUser.uid, receiverId],
        lastMessage: newMessage.trim(),
        timestamp: serverTimestamp(),
        unreadBy: [receiverId],
      });
      setNewMessage('');
    } catch (error) {
      console.error('Kunde inte skicka meddelande:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageRef = ref(storage, `chatImages/${chatId}/${Date.now()}_${file.name}`);
    try {
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUser.uid,
        imageUrl,
        timestamp: serverTimestamp(),
        type: 'image',
      });
      await setDoc(doc(db, 'chatSummaries', chatId), {
        participants: [currentUser.uid, receiverId],
        lastMessage: '🖼️ Bild',
        timestamp: serverTimestamp(),
        unreadBy: [receiverId],
      });
    } catch (error) {
      console.error('Kunde inte ladda upp bild:', error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowPicker(false);
    inputRef.current?.focus();
  };

  const handleGifClick = (gif, e) => {
    e.preventDefault();
    const gifUrl = gif.images.original.url;
    addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: currentUser.uid,
      imageUrl: gifUrl,
      timestamp: serverTimestamp(),
      type: 'gif',
    });
    setDoc(doc(db, 'chatSummaries', chatId), {
      participants: [currentUser.uid, receiverId],
      lastMessage: '🎞️ GIF',
      timestamp: serverTimestamp(),
      unreadBy: [receiverId],
    });
    setSearchTerm('');
    setShowGifs(false);
    return false;
  };

  const fetchGifs = async (offset) => {
    const term = searchTerm.trim();
    if (!term) return { data: [], pagination: { total_count: 0 } };
    latestSearchTerm.current = term;
    const response = await gf.search(term, { offset, limit: 10 });
    if (latestSearchTerm.current !== term) {
      return { data: [], pagination: { total_count: 0 } };
    }
    return response;
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp?.toDate();
    return date ? date.toLocaleString() : '';
  };

const handleBlockUser = async () => {
  const userRef = doc(db, 'users', currentUser.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentBlocked = userSnap.data().blockedUsers || [];
      if (!currentBlocked.includes(receiverId)) {
        await updateDoc(userRef, {
          blockedUsers: [...currentBlocked, receiverId],
        });
        alert(`${receiverName} har blockerats.`);
        navigate('/conversations');
      } else {
        alert('Användaren är redan blockerad.');
      }
    }
  } catch (error) {
    console.error('Fel vid blockering:', error);
  }
};

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Link to={`/users/${receiverId}`} className="chat-header">
          {receiverPhoto && (
            <img src={receiverPhoto} alt={receiverName} />
          )}
          <h2>{receiverName}</h2>
        </Link>
<span>gillar {Array.isArray(receiverInterests) ? receiverInterests.join(', ') : receiverInterests}</span>
      </div>

      <div className="message-box">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.senderId === currentUser.uid ? 'right' : 'left'}`}
          >
            {msg.type === 'image' || msg.type === 'gif' ? (
              <img
                src={msg.imageUrl}
                alt={msg.type === 'gif' ? 'GIF-meddelande' : 'Bildmeddelande'}
  className="message-image"
  onClick={() => setEnlargedImage(msg.imageUrl)}
              />
            ) : (
              <span>{msg.text}</span>
            )}
            <div className="timestamp">{formatTimestamp(msg.timestamp)}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <button type="button" onClick={() => setShowPicker((prev) => !prev)} className="emoji-button">😊</button>
        {showPicker && (
          <div ref={pickerRef} className="picker-container">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
        <label className="image-upload-label">
          📷
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        </label>
        <input
          ref={inputRef}
          type="text"
          placeholder="Skriv ett meddelande..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="message-input"
        />
        <button type="submit">Skicka</button>
      </form>

      <div className="gif-search">
        <input
          type="text"
          placeholder="Sök GIF"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showGifs && searchTerm && (
        <div className="gif-grid">
          <Grid
            key={gifKey}
            width={400}
            columns={3}
            fetchGifs={fetchGifs}
            onGifClick={handleGifClick}
          />
        </div>
      )}
  <div className="chat-actions">
    <button onClick={handleBlockUser} className="block-button">🚫 Blockera</button>
    <button onClick={handleReportUser} className="report-button">🚩 Rapportera</button>
  </div>

{showReportModal && (
  <ReportModal
    reportedUserId={receiverId}
    receiverName={receiverName}
    onClose={() => setShowReportModal(false)}
    onSubmit={submitReport}
  />
)}
          {enlargedImage && (
      <div className="image-modal" onClick={() => setEnlargedImage(null)}>
        <img src={enlargedImage} alt="Förstorad bild" className="enlarged-image" />
      </div>
    )}

    </div>
  );
}

export default Chat;
