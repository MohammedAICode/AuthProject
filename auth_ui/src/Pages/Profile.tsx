import Navbar from "../Components/Navbar/Navbar";
import { useAuth } from "../hooks/useAuth";
import { CgProfile } from "react-icons/cg";
import { HiOutlineMail, HiOutlineUser, HiOutlineShieldCheck, HiOutlineCalendar } from "react-icons/hi";

const Profile = () => {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {!loading && user ? (
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/50">
            {/* Header / Banner Area */}
            <div className="h-32 bg-indigo-600 sm:h-48" />
            
            <div className="relative px-6 pb-12 sm:px-10">
              {/* Profile Image / Avatar */}
              <div className="relative -mt-16 flex justify-center sm:-mt-24 sm:justify-start">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-48 sm:w-48">
                  {user.profileImg ? (
                    <img className="h-full w-full object-cover" src={user.profileImg} alt={user.firstname} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-200">
                      <CgProfile className="h-24 w-24 sm:h-32 sm:w-32" />
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Basic Info */}
              <div className="mt-6 text-center sm:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  {user.firstname} {user.lastname}
                </h1>
                <p className="mt-1 text-lg font-medium text-gray-500">@{user.username}</p>
              </div>

              {/* Stats / Badges */}
              <div className="mt-8 flex flex-wrap gap-3 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                  <HiOutlineShieldCheck className="h-4 w-4" />
                  {user.role}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-600 ring-1 ring-inset ring-gray-500/10">
                  {user.authProvider}
                </span>
              </div>

              {/* Details Grid */}
              <div className="mt-12 grid gap-8 border-t border-gray-100 pt-12 sm:grid-cols-2">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                      <HiOutlineMail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                      <HiOutlineUser className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Username</p>
                      <p className="font-medium text-gray-900">{user.username}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                      <HiOutlineCalendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Member Since</p>
                      <p className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                      <HiOutlineShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account Role</p>
                      <p className="font-medium text-gray-900">{user.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="font-medium text-gray-500 italic">Fetching your profile data...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
