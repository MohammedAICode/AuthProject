import { createContext } from "react";
import type { User } from "../utils/utils";

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  fetchMe: Function
};

export const authContext = createContext<AuthContextType | null>(null);
