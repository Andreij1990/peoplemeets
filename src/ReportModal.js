import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

const ReportModal = ({ reportedUserId, onClose }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleReport = async () => {
    const finalReason = reason === 'other' ? customReason : reason;
    if (!finalReason) return alert('Välj en orsak eller skriv en egen.');

    try {
      await addDoc(collection(db, 'reports'), {
        reportedBy: auth.currentUser.uid,
        reportedUserId,
        reason: finalReason,
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      alert('Rapporten är inskickad.');
      onClose();
    } catch (err) {
      console.error('Fel vid rapportering:', err);
      alert('Kunde inte skicka rapporten.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Rapportera profil</h3>
        <select onChange={(e) => setReason(e.target.value)} value={reason}>
          <option value="">Välj orsak</option>
          <option value="stötande språk">Stötande språk</option>
          <option value="hatretorik">Hatretorik eller mobbning</option>
          <option value="sexuellt innehåll">Sexuellt innehåll</option>
          <option value="fejkkonto">Fejkkonto</option>
          <option value="other">Annat</option>
        </select>

        {reason === 'other' && (
          <input
            type="text"
            placeholder="Ange orsak"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
          />
        )}

        <div className="modal-buttons">
          <button onClick={handleReport}>Skicka</button>
          <button onClick={onClose}>Avbryt</button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
