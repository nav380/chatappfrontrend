const dummyUsers = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    username: `nav${i + 1}`,
    profile_picture: null,
  }));
  
  export default dummyUsers;
  