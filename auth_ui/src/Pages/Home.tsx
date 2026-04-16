import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return <h1>Home Page, {user?.firstname}</h1>;
}

export default Home;
