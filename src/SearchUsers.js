import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Link } from 'react-router-dom';

const SearchUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [nameSearch, setNameSearch] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [landskap, setLandskap] = useState('');
  const [stad, setStad] = useState('');
  const [kön, setKön] = useState('');
  const [sexualitet, setSexualitet] = useState('');
  const [relationsstatus, setRelationsstatus] = useState('');
  const [intressen, setIntressen] = useState('');
  const [onlyNewUsers, setOnlyNewUsers] = useState(false);

  const isNewUser = (user) => {
    if (!user.createdAt) return false;
    const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return createdDate > threeDaysAgo;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      let q = collection(db, 'users');

      if (landskap) {
        q = query(q, where('landskap', '==', landskap));
      }

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(results);
    };

    fetchUsers();
  }, [landskap]);

  const handleSearch = () => {
    let result = [...users];

    if (nameSearch) {
      result = result.filter(user =>
        user.name?.toLowerCase().includes(nameSearch.toLowerCase())
      );
    }

    if (minAge) {
      result = result.filter(user => user.age >= parseInt(minAge));
    }

    if (maxAge) {
      result = result.filter(user => user.age <= parseInt(maxAge));
    }

    if (stad) {
      result = result.filter(user =>
        user.city?.toLowerCase().includes(stad.toLowerCase())
      );
    }

    if (kön) {
      result = result.filter(user => user.gender === kön);
    }

    if (sexualitet) {
      result = result.filter(user => user.sexuality === sexualitet);
    }

    if (relationsstatus) {
      result = result.filter(user => user.relationshipStatus === relationsstatus);
    }

    if (intressen) {
      result = result.filter(user =>
        Array.isArray(user.interests) &&
        user.interests.some(interest =>
          interest.toLowerCase().includes(intressen.toLowerCase())
        )
      );
    }

    if (onlyNewUsers) {
      result = result.filter(isNewUser);
    }

    const sortedUsers = result.sort((a, b) => {
      const aIsNew = isNewUser(a);
      const bIsNew = isNewUser(b);
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      return 0;
    });

    setFilteredUsers(sortedUsers);
    setSearchTriggered(true);
  };

  const handleResetFilters = () => {
    setNameSearch('');
    setMinAge('');
    setMaxAge('');
    setLandskap('');
    setStad('');
    setKön('');
    setSexualitet('');
    setRelationsstatus('');
    setIntressen('');
    setOnlyNewUsers(false);
    setSearchTriggered(false);
    setFilteredUsers([]);
  };

  return (
    <div>
      <h2>Sök användare</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
        <input
          type="text"
          placeholder="Sök namn"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />

        <input
          type="number"
          placeholder="Min ålder"
          value={minAge}
          onChange={(e) => setMinAge(e.target.value)}
        />

        <input
          type="number"
          placeholder="Max ålder"
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value)}
        />

        <select
          value={landskap}
          onChange={(e) => setLandskap(e.target.value)}
        >
          <option value="">Välj landskap</option>
          <option value="Blekinge">Blekinge</option>
          <option value="Bohuslän">Bohuslän</option>
          <option value="Dalarna">Dalarna</option>
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
          placeholder="Sök stad"
          value={stad}
          onChange={(e) => setStad(e.target.value)}
        />

        <select value={kön} onChange={(e) => setKön(e.target.value)}>
          <option value="">Välj kön</option>
          <option value="Kvinna">Kvinna</option>
          <option value="Man">Man</option>
          <option value="Annat">Annat</option>
        </select>

        <select value={sexualitet} onChange={(e) => setSexualitet(e.target.value)}>
          <option value="">Välj läggning</option>
          <option value="Heterosexuell">Heterosexuell</option>
          <option value="Homosexuell">Homosexuell</option>
          <option value="Bisexuell">Bisexuell</option>
          <option value="Annat">Annat</option>
        </select>

        <select value={relationsstatus} onChange={(e) => setRelationsstatus(e.target.value)}>
          <option value="">Relationsstatus</option>
          <option value="Singel">Singel</option>
          <option value="I ett förhållande">I ett förhållande</option>
          <option value="Gift">Gift</option>
          <option value="Öppen relation">Öppen relation</option>
          <option value="Komplicerat">Komplicerat</option>
        </select>

        <input
          type="text"
          placeholder="Sök på intressen"
          value={intressen}
          onChange={(e) => setIntressen(e.target.value)}
        />

        <label style={{ display: 'block', marginTop: '10px' }}>
          <input
            type="checkbox"
            checked={onlyNewUsers}
            onChange={(e) => setOnlyNewUsers(e.target.checked)}
          />
          Visa endast nya användare (registrerade senaste 3 dagarna)
        </label>

        <button type="submit">Sök</button>
        <button type="button" onClick={handleResetFilters}>Rensa filtren</button>
      </form>

      {searchTriggered && (
        <>
          <h3>Resultat:</h3>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.id}>
                <p>
                  <strong>
                    <Link to={`/users/${user.id}`}>
                      {user.gender === 'Kvinna' ? '♀️' : user.gender === 'Man' ? '♂️' : ''}
                      {user.name}
                    </Link>
                    {' '}
                    {isNewUser(user) && <span className='new-user-label'>ny</span>}
                  </strong> ({user.age})
                </p>
                <p>{user.landskap}, {user.city}</p>
              </div>
            ))
          ) : (
            <p>Inga användare matchar dina kriterier.</p>
          )}
        </>
      )}
    </div>
  );
};

export default SearchUsers;
