import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginUser, type apiResponse } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

export interface userLoginInfo {
  email: string | "";
  password: string | "";
}

export default function Login() {
  let [LoginInfo, setLoginInfo] = useState<userLoginInfo>({
    email: "",
    password: "",
  });
  let [showPass, setShowPass] = useState<boolean>(true);
  let [isError, setIsError] = useState<string | null>(null);
  let navigate = useNavigate();
  const { fetchMe } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginInfo({
      ...LoginInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!LoginInfo.email) {
      setIsError("Username cannot be empty!");
      return;
    } else if (!LoginInfo.password) {
      setIsError("Password cannot be empty!");
      return;
    } else {
      setIsError(null);
    }

    let response: apiResponse | null = null;

    response = await loginUser(LoginInfo);
    console.log(`Response from login page ${JSON.stringify(response)}`);

    if (response.err) {
      setIsError("*" + response.message.toLowerCase());
      return;
    }

    if (!response.err) {
      fetchMe();
      navigate("/");
    }
  };

  const handleForget = () => {
    if (!LoginInfo.email) {
      setIsError("Username cannot be empty!");
      return;
    }

    

  };

  return (
    <div className="h-screen flex justify-center items-center bg-linear-to-br from-gray-100 to-gray-200">
      <div className="w-96 bg-white p-8 rounded-2xl shadow-lg flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Welcome.</h2>
          <p className="text-gray-500 text-sm mt-1">Login to continue</p>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-2 rounded-md">
            {isError}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            className="w-full border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-2.5 rounded-lg transition-all"
            value={LoginInfo.email}
            name="email"
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-1 relative">
          <label className="text-sm text-gray-600">Password</label>

          <input
            type={showPass ? "password" : "text"}
            placeholder="Enter password"
            className="w-full border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-2.5 rounded-lg transition-all pr-10"
            value={LoginInfo.password}
            name="password"
            onChange={handleChange}
          />

          <aside
            className="absolute right-3 top-9.5 text-gray-500 cursor-pointer hover:text-gray-700"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <FaRegEye /> : <FaRegEyeSlash />}
          </aside>
        </div>

        <p
          className="text-sm text-right text-secondary cursor-pointer hover:underline"
          onClick={handleForget}
        >
          Forgot password?
        </p>

        <button
          className="w-full bg-secondary text-white py-2.5 rounded-lg font-medium hover:bg-dark-light transition-all shadow-sm"
          onClick={handleSubmit}
        >
          Login
        </button>

        <p className="text-sm text-center text-gray-600">
          New user?{" "}
          <span
            className="text-secondary font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Create account
          </span>
        </p>
      </div>
    </div>
  );
}
