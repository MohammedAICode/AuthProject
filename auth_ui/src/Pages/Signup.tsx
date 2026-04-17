import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { userSignupInfo } from "../utils/utils";
import { signupUser } from "../services/authService";

function Signup() {
  let navigate = useNavigate();
  let [isError, setIsError] = useState<string | null>(null);

  let [signupInfo, setSignupInfo] = useState<userSignupInfo>({
    firstname: "",
    lastname: "",
    email: "",
    username: "",
    profileImg: null,
  });

  let handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      `e.target.name == "profileImg" ${e.target.name == "profileImg"}`,
    );

    if (e.target.name == "profileImg" && e.target.files) {
      setSignupInfo({
        ...signupInfo,
        profileImg: e.target.files[0],
      });
    } else {
      setSignupInfo({
        ...signupInfo,
        [e.target.name]: e.target.value,
      });
    }
  };

  let handleSubmit = async () => {
    console.log(`Signup Info :: ${JSON.stringify(signupInfo)}`);

    // Add zod formatting here..
    if (!signupInfo.firstname) {
      setIsError("First name is required.");
      return;
    }
    if (!signupInfo.lastname) {
      setIsError("Last name is required.");
      return;
    }
    if (!signupInfo.email) {
      setIsError("Email is required");
      return;
    }

    let response = await signupUser(signupInfo);

    if (!response.err) {
      navigate(`/verify?email=${signupInfo.email}`);
    }

    setIsError(response.message || "Internal Server Error");
    return;
  };

  return (
    <div className="h-screen flex justify-center items-center bg-linear-to-br from-gray-100 to-gray-200">
      <div className="w-105 bg-white p-8 rounded-2xl shadow-lg flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">Sign up to get started</p>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-2 rounded-md">
            {isError}
          </div>
        )}

        {/* First + Last name */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 w-1/2">
            <label className="text-sm text-gray-600">First name</label>
            <input
              type="text"
              name="firstname"
              placeholder="John"
              value={signupInfo.firstname!}
              onChange={handleChange}
              className="border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-2.5 rounded-lg transition-all"
            />
          </div>

          <div className="flex flex-col gap-1 w-1/2">
            <label className="text-sm text-gray-600">Last name</label>
            <input
              type="text"
              name="lastname"
              placeholder="Doe"
              value={signupInfo.lastname!}
              onChange={handleChange}
              className="border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-2.5 rounded-lg transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Email</label>
          <input
            type="email"
            name="email"
            placeholder="example@email.com"
            value={signupInfo.email!}
            onChange={handleChange}
            className="border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-2.5 rounded-lg transition-all"
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Username</label>
          <input
            type="text"
            name="username"
            placeholder="choose username"
            value={signupInfo.username!}
            onChange={handleChange}
            className="border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-2.5 rounded-lg transition-all"
          />
        </div>

        {/* File Upload */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Profile image</label>

          <input
            type="file"
            name="profileImg"
            accept="image/*"
            onChange={handleChange}
            className="border border-gray-300 file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-secondary file:text-white file:rounded-md file:cursor-pointer hover:file:bg-dark-light rounded-lg p-1.5"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-secondary text-white py-2.5 rounded-lg font-medium hover:bg-dark-light transition-all shadow-sm mt-1"
        >
          Continue
        </button>

        {/* Footer */}
        <p className="text-sm text-center text-gray-600">
          Already registered?{" "}
          <span
            className="text-secondary font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
