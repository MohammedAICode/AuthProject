import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getInitialOfFullName } from "../../utils/utils";
import { logout } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { IoLogOutOutline } from "react-icons/io5";
import { FaUsers } from "react-icons/fa6";
import Loader from "../Loader/Loader";

function Navbar() {
  const { user, loading, setUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);

  async function handleLogout() {
    const response = await logout();

    if (!response.err) {
      setUser(null);
      navigate("/login");
    }
  }

  useEffect(() => {
    function handleClickedOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickedOutside);

    return () => {
      document.addEventListener("mousedown", handleClickedOutside);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-xl font-bold tracking-tight text-gray-900 transition-colors hover:text-indigo-600"
        >
          Auth System
        </button>
        <div className="flex items-center gap-4">
          {loading ? (
             <Loader size="sm" />
          ) : user ? (
            <div className="relative">
              <section
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-700 shadow-sm transition-all hover:bg-indigo-100 hover:shadow-md active:scale-95"
              >
                {getInitialOfFullName(user.firstname, user.lastname)}
              </section>

              {showMenu && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
                >
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    onClick={() => {
                      navigate("/profile");
                      setShowMenu(false);
                    }}
                  >
                    <CgProfile className="text-lg" />
                    <span>Profile</span>
                  </button>

                  {user.role === "ADMIN" ? (
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                      onClick={() => {
                        navigate("/profile");
                        setShowMenu(false);
                      }}
                    >
                      <FaUsers className="text-lg" />
                      <span>Users</span>
                    </button>
                  ) : (
                    <></>
                  )}
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={handleLogout}
                  >
                    <IoLogOutOutline className="text-lg" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
               onClick={() => navigate("/login")}
               className="text-sm font-medium text-secondary hover:underline"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
