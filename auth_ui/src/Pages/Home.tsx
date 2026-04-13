import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { me, type apiResponse } from "../services/authService";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      const response = await me();

      if (response.err) {
        navigate("/login");
      } else {
        console.log("Me:", response.data);
      }
    };

    fetchMe();
  }, []);

  return <h1>Home Page</h1>;
}

export default Home;
