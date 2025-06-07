import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './css/ConversationList.css';
import defaultProfilePic from './assets/default-profile-pic.jpg';

const ConversationList = ({ currentUser, setUnreadCount }) => {
  const [conversations, setConversations] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState({ local: [], national: [] });
  const [currentUserData, setCurrentUserData] = useState({});
  const [genderFilter, setGenderFilter] = useState('all');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [showNational, setShowNational] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

const fetchConversations = async () => {
  const convQuery = query(
    collection(db, 'chatSummaries'),
    where('participants', 'array-contains', currentUser.uid),
    orderBy('timestamp', 'desc')
  );

  const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (!currentUserDoc.exists()) return;
  const currentUserData = currentUserDoc.data();
  const blockedUsers = currentUserData.blockedUsers || [];
  setCurrentUserData(currentUserData);

  const convSnapshot = await getDocs(convQuery);
  const rawConversations = convSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const allConversationUserIds = new Set();
  const activeConversationUserIds = new Set();
  const latestConversations = [];
  let unreadMessagesCount = 0;

  for (let conv of rawConversations) {
    const otherUserId = conv.participants.find(uid => uid !== currentUser.uid);

    allConversationUserIds.add(otherUserId);

    if (conv.deletedBy?.[currentUser.uid]) continue;

    activeConversationUserIds.add(otherUserId);

    const userDoc = await getDoc(doc(db, 'users', otherUserId));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const otherUserName = userData.name || 'Okänd användare';
const otherUserPhoto = userData.photoURL || defaultProfilePic;

    const messagesRef = collection(db, 'chats', conv.id, 'messages');
    const messagesSnapshot = await getDocs(query(messagesRef, orderBy('timestamp', 'desc')));
    const latestMessage = messagesSnapshot.docs[0]?.data();

const isUnread = conv.unreadBy?.includes(currentUser.uid);
    if (isUnread) unreadMessagesCount++;

    let lastMessageText = '';
    if (!latestMessage) lastMessageText = '';
    else if (latestMessage.type === 'gif') lastMessageText = '🎞️ GIF';
    else if (latestMessage.type === 'image') lastMessageText = '🖼️ Bild';
    else lastMessageText = latestMessage.text || '';

    latestConversations.push({
      ...conv,
      otherUserId,
      otherUserName,
      otherUserPhoto,
      lastMessage: lastMessageText,
      isUnread,
    });
  }

  setConversations(latestConversations);
  setUnreadCount(unreadMessagesCount);

  if (currentUserData.genderPreference) setGenderFilter(currentUserData.genderPreference);
  if (currentUserData.ageMinPreference) setMinAge(currentUserData.ageMinPreference);
  if (currentUserData.ageMaxPreference) setMaxAge(currentUserData.ageMaxPreference);

  const currentUserInterests = currentUserData.interests || [];

  const usersQuery = query(collection(db, 'users'));
  const usersSnapshot = await getDocs(usersQuery);

  const local = [];
  const national = [];

  usersSnapshot.forEach(userDoc => {
    if (userDoc.id === currentUser.uid) return;

    if (activeConversationUserIds.has(userDoc.id)) return;

    if (blockedUsers.includes(userDoc.id)) return;

    const user = userDoc.data();
    const userInterests = user.interests || [];
    const hasCommonInterest = userInterests
    .map(i => i.toLowerCase())
    .some(i => currentUserInterests.map(ci => ci.toLowerCase()).includes(i));

    if (!hasCommonInterest) return;

    if (genderFilter !== 'all' && user.gender?.toLowerCase() !== genderFilter) return;
    if (minAge && user.age < minAge) return;
    if (maxAge && user.age > maxAge) return;

    const userData = {
      id: userDoc.id,
      name: user.name || 'Okänd användare',
photoURL: user.photoURL || defaultProfilePic,
      interests: userInterests,
      city: user.city || '',
      landskap: user.landskap || '',
      gender: user.gender || '',
      age: user.age || '',
      sexuality: user.sexuality || '',
      relationshipStatus: user.relationshipStatus || '',
      createdAt: user.createdAt ? user.createdAt.toDate() : null,
    };

    if (user.landskap === currentUserData.landskap) {
      local.push(userData);
    } else {
      national.push(userData);
    }
  });

  setSuggestedUsers({
    local: local.sort(() => 0.5 - Math.random()).slice(0, 5),
    national: national.sort(() => 0.5 - Math.random()).slice(0, 5),
  });
};
    fetchConversations();
  }, [currentUser, setUnreadCount, genderFilter, minAge, maxAge]);

  const updatePreference = async (key, value) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      [key]: value,
    });
  };

  const reshuffleSuggestions = () => {
    setSuggestedUsers(prev => ({
      local: [...prev.local].sort(() => 0.5 - Math.random()).slice(0, 5),
      national: [...prev.national].sort(() => 0.5 - Math.random()).slice(0, 5),
    }));
  };

  const handleGenderChange = (e) => {
    const value = e.target.value;
    setGenderFilter(value);
    updatePreference('genderPreference', value);
  };

  const handleMinAgeChange = (e) => {
    const value = e.target.value;
    setMinAge(value);
    updatePreference('ageMinPreference', Number(value));
  };

  const handleMaxAgeChange = (e) => {
    const value = e.target.value;
    setMaxAge(value);
    updatePreference('ageMaxPreference', Number(value));
  };

const renderUserList = (users) => {
  return users.map(user => {
const commonInterests = user.interests.filter(i =>
  currentUserData.interests?.some(ci => ci.toLowerCase() === i.toLowerCase())
);

    const isNewUser = user.createdAt && (Date.now() - user.createdAt.getTime()) < 3 * 24 * 60 * 60 * 1000;

const formatField = (label, value, match) => (
  value ? (
    <div className="other-label">
      {label} <span className={`field-value${match ? ' field-match' : ''}`}>{value}</span>
    </div>
  ) : null
);

return (
<li key={user.id} className="suggested-user-item">
<div className="user-left">
  <Link to={`/users/${user.id}`} className="user-profile-link">
    <img src={user.photoURL} alt={user.name} className="profile-img" />
  <div className="user-name">
    {user.name}
    {isNewUser && <span className="new-user-label">Ny</span>}
  </div>
  </Link>
</div>

<div className="user-interests">
  <span className="interest-label">
    <span className="interest-marker"></span>
    {user.interests.map((interest, index) => (
      <span
        key={index}
        className={`interest-value${commonInterests.includes(interest) ? ' match' : ''}`}
      >
        {interest}{' '}
      </span>
    ))}
  </span>
</div>

  <div className="user-details">
    {formatField('Stad:', user.city, user.city === currentUserData.city)}
    {formatField('Kön:', user.gender, user.gender === currentUserData.gender)}
    {formatField('Ålder:', user.age, user.age === currentUserData.age)}
    {formatField('Läggning:', user.sexuality, user.sexuality === currentUserData.sexuality)}
    {formatField('Relation:', user.relationshipStatus, user.relationshipStatus === currentUserData.relationshipStatus)}
  </div>

  <div className="chat-button-container">
    <Link to={`/chat/${user.id}`} className="chat-link">💬 <span>Chatta</span></Link>
  </div>
</li>
    );
  });
};


  const handleDeleteConversation = async (conversationId) => {
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, 'chatSummaries', conversationId), {
        [`deletedBy.${currentUser.uid}`]: true,
      });

      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error("Kunde inte ta bort konversationen:", error);
    }
  };

const handleBlockUser = async (otherUserId) => {
  if (!currentUser) return;

  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentBlocked = userDoc.data().blockedUsers || [];

      if (!currentBlocked.includes(otherUserId)) {
        await updateDoc(userRef, {
          blockedUsers: arrayUnion(otherUserId),
        });

        setCurrentUserData(prev => ({
          ...prev,
          blockedUsers: [...(prev.blockedUsers || []), otherUserId],
        }));
      }
    }
  } catch (error) {
    console.error("Kunde inte blockera användaren:", error);
  }
};

const handleUnblockUser = async (otherUserId) => {
  if (!currentUser) return;

  try {
    const userRef = doc(db, 'users', currentUser.uid);

    await updateDoc(userRef, {
      blockedUsers: arrayRemove(otherUserId),
    });

    setCurrentUserData(prev => ({
      ...prev,
      blockedUsers: (prev.blockedUsers || []).filter(id => id !== otherUserId),
    }));
  } catch (error) {
    console.error("Kunde inte avblockera användaren:", error);
  }
};

  return (
    <div className="conversation-list-container">
      <h2>Konversationer</h2>
<ul>
  {conversations.map(conv => {
    const isBlocked = currentUserData.blockedUsers?.includes(conv.otherUserId);

    return (
      <li
        key={conv.id}
        className={`conversation-item ${isBlocked ? 'blocked' : ''}`}
      >
        <Link
          to={isBlocked ? '#' : `/chat/${conv.otherUserId}`}
          className="conversation-link"
          onClick={e => isBlocked && e.preventDefault()}
        >
          <img
            src={conv.otherUserPhoto}
            alt={conv.otherUserName}
            className="profile-img"
          />
          <span>
           {conv.otherUserName}<span className='last-message'> {conv.lastMessage}</span>
            {isBlocked && <span className='blockerad-status'> (Blockerad)</span>}
          </span>
{!isBlocked && conv.isUnread && <span className="unread-indicator">Oläst</span>}
        </Link>

{isBlocked ? (
  <button
    onClick={() => handleUnblockUser(conv.otherUserId)}
    className="unblock-button"
    title="Avblockera"
  >
    ❎
  </button>
) : (
  <button
    onClick={() => handleBlockUser(conv.otherUserId)}
    className="block-button"
    title="Blockera"
  >
    🚫
  </button>
)}
        <button
          onClick={() => handleDeleteConversation(conv.id)}
          className="delete-button"
          title="Kasta"
        >
          🗑️
        </button>
      </li>
    );
  })}
</ul>


      <h2>Användare med gemensamma intressen</h2>
            <div className="preferences">
        <label className='gender-label'>
          Kön:</label>
          <select value={genderFilter} onChange={handleGenderChange}>
            <option value="all">Alla</option>
            <option value="man">Man</option>
            <option value="kvinna">Kvinna</option>
          </select>
        <label className='age-label'>
          Min ålder:</label>
          <input type="number" placeholder='0' value={minAge} onChange={handleMinAgeChange} />
        <label className='age-label'>
          Max ålder:</label>
          <input type="number" placeholder='99+' value={maxAge} onChange={handleMaxAgeChange} />
      </div>
      <label>
        Inkludera användare från hela landet:
        <input
          type="checkbox"
          checked={showNational}
          onChange={() => setShowNational(prev => !prev)}
        />
      </label>
      <button onClick={reshuffleSuggestions} className="reshuffle-button">
      🔄 Slumpa nya förslag
      </button>

      <ul className="suggested-users-list">
        {renderUserList(suggestedUsers.local)}
        {showNational && renderUserList(suggestedUsers.national)}
      </ul>
    </div>
  );
};

export default ConversationList;
