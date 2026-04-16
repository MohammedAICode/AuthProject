import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

const PublicRoutes = ({ children }: any) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user) return <Navigate to={"/"} />;

  return children;
};

export default PublicRoutes;
