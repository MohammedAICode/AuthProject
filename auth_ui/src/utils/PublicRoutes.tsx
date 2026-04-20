import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import Loader from "../Components/Loader/Loader";

const PublicRoutes = ({ children }: any) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullPage />;

  if (user) return <Navigate to={"/"} />;

  return children;
};

export default PublicRoutes;
