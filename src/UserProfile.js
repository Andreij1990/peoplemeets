import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, db, storage } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ReportModal from './ReportModal.js';
import './css/UserProfile.css';

const UserProfile = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [profileText, setProfileText] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [newPhoto, setNewPhoto] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [newGalleryPhotos, setNewGalleryPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfileText, setOriginalProfileText] = useState('');
  const [originalPhotoURL, setOriginalPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [landskap, setLandskap] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [sexuality, setSexuality] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState('');
  const [lastActive, setLastActive] = useState(null);
  const [shouldDeleteProfileImage, setShouldDeleteProfileImage] = useState(false);
  const editSectionRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUserData, setPreviewUserData] = useState(null);

  const [showReport, setShowReport] = useState(false);
  const currentUser = auth.currentUser;
  const isOwner = currentUser && currentUser.uid === id;

  useEffect(() => {
  const handleScroll = () => {
    setShowScrollButton(window.scrollY > 400);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  useEffect(() => {
  if (isEditing && editSectionRef.current) {
    editSectionRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [isEditing]);


  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({ id: docSnap.id, ...data });
        setProfileText(data.profileText || '');
        setPhotoURL(data.photoURL || '');
        setOriginalProfileText(data.profileText || '');
        setOriginalPhotoURL(data.photoURL || '');
        setLandskap(data.landskap || '');
        setCity(data.city || '');
        setGender(data.gender || '');
        setSexuality(data.sexuality || '');
        setRelationshipStatus(data.relationshipStatus || '');
        setAge(data.age || '');
        setInterests(data.interests?.join(', ') || '');
        setGallery(data.gallery || []);
        setLastActive(data.lastActive || null);
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

const scrollToTop = () => {
  window.scrollTo({ top: 190, behavior: 'smooth' });

  const updatedPreview = {
    ...userData,
    profileText,
    photoURL,
    landskap,
    city,
    gender,
    sexuality,
    relationshipStatus,
    age,
    interests: interests.split(',').map(i => i.trim()),
    gallery: [...gallery, ...newGalleryPhotos.map(p => p.preview)],
  };

  setPreviewUserData(updatedPreview);
};



const handleDeleteGalleryImage = async (imageUrlToDelete) => {
  try {
    const url = new URL(imageUrlToDelete);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]);
    await deleteImageFromStorage(path);

    const updatedGallery = gallery.filter((url) => url !== imageUrlToDelete);
    setGallery(updatedGallery);

    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
      gallery: updatedGallery,
    });
  } catch (error) {
    console.error('Fel vid borttagning av galleri-bild:', error);
    alert('Något gick fel när bilden skulle tas bort.');
  }
};

const formatLastActive = (timestamp) => {
  if (!timestamp) return 'okänd';
  const lastActiveDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = Date.now() - lastActiveDate.getTime();
  const diffMin = Math.floor(diffMs / 1000 / 60);

  if (diffMin < 1) return 'Online nu';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minut' : 'minuter'} sedan`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'timme' : 'timmar'} sedan`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'dag' : 'dagar'} sedan`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'vecka' : 'veckor'} sedan`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'månad' : 'månader'} sedan`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} ${diffYears === 1 ? 'år' : 'år'} sedan`;
};

  const handleImageUpload = async () => {
    if (!newPhoto) return photoURL;
    const fileRef = ref(storage, `profilePictures/${id}/${newPhoto.name}`);
    await uploadBytes(fileRef, newPhoto);
    const url = await getDownloadURL(fileRef);
    return url;
  };

  const handleGalleryUpload = async () => {
    if (newGalleryPhotos.length === 0) return gallery;
    const uploadedURLs = [];

    for (const photo of newGalleryPhotos) {
      const fileRef = ref(storage, `profileGallery/${id}/${photo.name}-${Date.now()}`);
      await uploadBytes(fileRef, photo);
      const url = await getDownloadURL(fileRef);
      uploadedURLs.push(url);
    }

    const updatedGallery = [...gallery, ...uploadedURLs].slice(0, 3);
    return updatedGallery;
  };

const handleUpdate = async (exitEditMode = true) => {
  setIsSaving(true);
  try {
    let uploadedURL = photoURL;
    if (newPhoto) {
      uploadedURL = await handleImageUpload();
    }

    if (shouldDeleteProfileImage && originalPhotoURL) {
      const url = new URL(originalPhotoURL);
      const path = decodeURIComponent(url.pathname.split('/o/')[1]);
      await deleteImageFromStorage(path);
      uploadedURL = '';
    }

    const updatedGallery = await handleGalleryUpload();

    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
      profileText,
      photoURL: uploadedURL,
      landskap,
      city,
      gender,
      sexuality,
      relationshipStatus,
      age,
      interests: interests.split(',').map(i => i.trim()),
      gallery: updatedGallery,
    });

    setShouldDeleteProfileImage(false);

    const updatedSnap = await getDoc(docRef);
    if (updatedSnap.exists()) {
      const updatedData = updatedSnap.data();
      setUserData({ id: updatedSnap.id, ...updatedData });
      setProfileText(updatedData.profileText || '');
      setPhotoURL(updatedData.photoURL || '');
      setOriginalProfileText(updatedData.profileText || '');
      setOriginalPhotoURL(updatedData.photoURL || '');
      setGallery(updatedData.gallery || []);
    }

    setNewGalleryPhotos([]);

    if (exitEditMode) {
      setIsEditing(false);
    }
  } catch (error) {
    console.error('Fel vid uppdatering:', error);
  } finally {
    setIsSaving(false);
  }
};


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhoto(file);
      setPhotoURL(URL.createObjectURL(file));
    }
  };

  const deleteImageFromStorage = async (url) => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Kunde inte radera bilden från Storage:', error.message);
  }
};

  const handleRemoveProfileImage = () => {
  setPhotoURL('');
  setNewPhoto(null);
};

  const handleTextChange = (e) => {
    setProfileText(e.target.value);
  };

const handleCancelEditing = () => {
  setGallery(userData?.gallery || []);
  
  setProfileText(originalProfileText || '');
  setPhotoURL(originalPhotoURL);
  setNewPhoto(null);
  setNewGalleryPhotos([]);
    setPreviewUserData(null);
  
  setLandskap(userData?.landskap || '');
  setCity(userData?.city || '');
  setGender(userData?.gender || '');
  setSexuality(userData?.sexuality || '');
  setRelationshipStatus(userData?.relationshipStatus || '');
  setAge(userData?.age || '');
  setInterests(userData?.interests?.join(', ') || '');

  setIsEditing(false);
};

  if (loading) return <p>Laddar...</p>;
  if (!userData) return <p>Ingen användare hittades.</p>;

return (
  <>
    <div className="profile-page">
      <div className="profile-main">
        <div className="profile-left">
          {isOwner && isEditing ? (
            <>
              <div className="profile-image-wrapper">
                <label htmlFor="profile-image-upload" className="profile-image-label">
                  <img
                    src={photoURL || '/default-profile.png'}
                    alt="Profilbild"
                    className="profile-image editable"
                  />
                  <div className="profile-image-overlay">Byt</div>
                </label>
                <button
                  onClick={handleRemoveProfileImage}
                  type="button"
                  title="Ta bort profilbild"
                >
                  X
                </button>
              </div>

              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </>
          ) : (
            userData?.photoURL && (
              <img
                src={userData.photoURL}
                alt={`${userData.name}s profilbild`}
                className="profile-image"
                onClick={() => setSelectedImage(photoURL)}
                style={{ cursor: 'pointer' }}
              />
            )
          )}

          <h2 className="profile-name">{userData?.name}</h2>


  <div className="profile-values">
<p><strong>Landskap:</strong> {(previewUserData || userData)?.landskap}</p>
    <p><strong>Stad:</strong> {(previewUserData || userData)?.city}</p>
    <p><strong>Ålder:</strong> {(previewUserData || userData)?.age}</p>
    <p><strong>Kön:</strong>  {(previewUserData || userData)?.gender}</p>
    <p><strong>Läggning:</strong> {(previewUserData || userData)?.sexuality}</p>
    <p><strong>Status:</strong> {(previewUserData || userData)?.relationshipStatus}</p>
    <p><strong>Intressen:</strong> {(previewUserData || userData)?.interests?.join(', ')}</p>
  </div>

          {!isOwner && (
            <p>
              <strong>Senast aktiv:</strong>{' '}
              {formatLastActive(lastActive)}
            </p>
          )}

          {!isOwner && userData?.id && (
            <Link to={`/chat/${userData.id}`}>
              <button className="message-button">✉️ Skicka meddelande</button>
            </Link>
          )}

                {!isOwner && (
        <button onClick={() => setShowReport(true)}>🚩 Rapportera</button>
      )}

      {showReport && (
        <ReportModal
          reportedUserId={userData.id}
          profileText={userData.profileText}
          onClose={() => setShowReport(false)}
        />
      )}

          {isOwner && !isEditing && (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
            🖌️ Redigera profil
            </button>
          )}
        </div>

        <div className="profile-right">
          <h3>Om mig</h3>
          <div className="profile-text-container">
          <p className="profile-text">{(previewUserData || userData).profileText}</p>
          </div>


          <div className="profile-gallery">
            <div className="gallery-images">
              {gallery.map((url, idx) => (
                <div key={`gallery-${idx}`} className="gallery-image-wrapper">
                  <img
                    src={url}
                    alt={`Gallery ${idx}`}
                    className="gallery-image"
                    onClick={() => setSelectedImage(url)}
                    style={{ cursor: 'pointer' }}
                  />
                  {isOwner && isEditing && (
                    <button
                      className="remove-gallery-button"
                      onClick={() => handleDeleteGalleryImage(url)}
                      title="Ta bort bild"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}

              {newGalleryPhotos.map((file, idx) => (
                <div key={`new-${idx}`} className="gallery-image-wrapper">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Ny galleri bild ${idx + 1}`}
                    className="gallery-image"
                  />
                  <button
                    className="remove-gallery-button"
                    onClick={() => {
                      const updated = [...newGalleryPhotos];
                      updated.splice(idx, 1);
                      setNewGalleryPhotos(updated);
                    }}
                    title="Ta bort vald bild"
                  >
                    X
                  </button>
                </div>
              ))}

              {isOwner && isEditing && gallery.length + newGalleryPhotos.length < 3 && (
                <>
                  <label htmlFor="gallery-upload" className="add-image-box">+</label>
                  <input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files).slice(0, 3 - gallery.length - newGalleryPhotos.length);
                      setNewGalleryPhotos(prev => [...prev, ...files]);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Större bild" className="modal-image" />
        </div>
      )}

      {isOwner && isEditing && (
        <div className="profile-edit-form" ref={editSectionRef}>
<textarea
  value={profileText}
  onChange={handleTextChange}
  maxLength={700}
  placeholder="Skriv något om dig själv"
/>
<p className="char-counter">{profileText.length}/700</p>
          <select value={landskap} onChange={(e) => setLandskap(e.target.value)}>
            <option value="">Välj landskap</option>
      <option value="Blekinge">Blekinge</option>
      <option value="Bohuslän">Bohuslän</option>
      <option value="Dalarna">Dalarna</option>
      <option value="Dalsland">Dalsland</option>
      <option value="Gotland">Gotland</option>
      <option value="Gästrikland">Gästrikland</option>
      <option value="Halland">Halland</option>
      <option value="Hälsingland">Hälsingland</option>
      <option value="Härjedalen">Härjedalen</option>
      <option value="Jämtland">Jämtland</option>
      <option value="Lappland">Lappland</option>
      <option value="Medelpad">Medelpad</option>
      <option value="Norrbotten">Norrbotten</option>
      <option value="Närke">Närke</option>
      <option value="Skåne">Skåne</option>
      <option value="Småland">Småland</option>
      <option value="Södermanland">Södermanland</option>
      <option value="Uppland">Uppland</option>
      <option value="Värmland">Värmland</option>
      <option value="Västerbotten">Västerbotten</option>
      <option value="Västergötland">Västergötland</option>
      <option value="Västmanland">Västmanland</option>
      <option value="Ångermanland">Ångermanland</option>
      <option value="Öland">Öland</option>
      <option value="Östergötland">Östergötland</option>
          </select>

                    <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={100}
            placeholder="Stad/ort"
          />

          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Ålder"
          />

          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Välj kön</option>
            <option value="Kvinna">Kvinna</option>
            <option value="Man">Man</option>
            <option value="Annat">Annat</option>
          </select>

          <select value={sexuality} onChange={(e) => setSexuality(e.target.value)}>
            <option value="">Välj läggning</option>
            <option value="Heterosexuell">Heterosexuell</option>
            <option value="Homosexuell">Homosexuell</option>
            <option value="Bisexuell">Bisexuell</option>
            <option value="Asexuell">Asexuell</option>
            <option value="Annat">Annat</option>
          </select>

          <select
            value={relationshipStatus}
            onChange={(e) => setRelationshipStatus(e.target.value)}
          >
            <option value="">Välj relationsstatus</option>
            <option value="Singel">Singel</option>
            <option value="I ett förhållande">I ett förhållande</option>
            <option value="Gift">Gift</option>
            <option value="Öppen relation">Öppen relation</option>
            <option value="Komplicerat">Komplicerat</option>
          </select>

<input
  type="text"
  value={interests}
  onChange={(e) => {
    const rawValue = e.target.value;
    const interestsArray = rawValue
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    if (interestsArray.length <= 10) {
      setInterests(rawValue);
    } else {
      alert("Max 10 intressen är tillåtna.");
    }
  }}
  placeholder="Intressen (kommaseparerade)"
/>

<div className='char-counter'>
  {interests
    .split(',')
    .map((i) => i.trim())
    .filter(Boolean).length} / 10 intressen valda
</div>
          <div className="sticky-buttons">
                        <button onClick={handleCancelEditing} disabled={isSaving} style={{ cursor: isSaving ? 'wait' : "pointer" }}>Avbryt</button>
            <button onClick={handleUpdate} disabled={isSaving} style={{ cursor: isSaving ? "wait" : "pointer" }}>
  {isSaving ? "Uppdaterar..." : "Uppdatera profil"}
            </button>
                                    {showScrollButton && (
              <button onClick={scrollToTop} title='Till profil' style={{ cursor: isSaving ? 'wait' : "pointer" }}>⬆️</button>
            )}
          </div>
        </div>
      )}

      {isSaving && <p>Uppdaterar profil...</p>}
    </div>
  </>
);
};

export default UserProfile;