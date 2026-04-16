import { useEffect, useState } from "react";
import { convertJsonToUserObj, type User } from "../utils/utils";
import { me } from "../services/authService";
import { authContext } from "./AuthContext";

const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

   const fetchMe = async () => {
    try {
      const response = await me();
      let convertedUser = convertJsonToUserObj(response.data.data);
      setUser(convertedUser);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <authContext.Provider value={{ user, setUser, loading, fetchMe }}>
      {children}
    </authContext.Provider>
  );
};

export default AuthProvider;
