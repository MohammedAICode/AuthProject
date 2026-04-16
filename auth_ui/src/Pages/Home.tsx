import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../Components/Navbar/Navbar";

function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/30">
      <Navbar />

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        {!loading && user ? (
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-light text-gray-500 sm:text-6xl tracking-tight">
              Welcome Home,
            </h1>
            <div className="text-5xl font-black sm:text-8xl tracking-tighter">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {user.firstname} {user.lastname}
              </span>
            </div>
            <p className="text-gray-400 font-medium text-lg sm:text-xl max-w-md mx-auto">
              You've successfully logged into your premium auth account.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-gray-400 font-medium">Loading your experience...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;
