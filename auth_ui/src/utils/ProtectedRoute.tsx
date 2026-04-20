import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import Loader from "../Components/Loader/Loader";

const ProtectedRoute = ({ children }: any) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullPage />;
  if (!user) return <Navigate to={"/login"} />;

  return children;
};

export default ProtectedRoute;
