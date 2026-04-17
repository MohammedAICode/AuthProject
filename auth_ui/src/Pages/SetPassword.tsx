import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { setUpPass } from "../services/authService";
import { useNavigate } from "react-router-dom";

const SetPassword = () => {
  let [showPass, setShowPass] = useState<boolean>(true);
  const navigate = useNavigate();
  let [userPass, setUserPass] = useState({
    password: "",
    confirmPass: "",
  });
  let [isError, setIsError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUserPass({
      ...userPass,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit() {
    if (!userPass.password) {
      setIsError("Password is required");
      return;
    }

    if (!userPass.confirmPass) {
      setIsError("Confirm password is required");
      return;
    }

    if(userPass.password !==userPass.confirmPass) {
      setIsError("Password does not match!");
      return;
    }

    console.log(`user Details: ${JSON.stringify(userPass)}`);

    let response = await setUpPass(userPass.password, userPass.confirmPass);

    if (!response.err) {
      navigate("/login");
    }
  }

  return (
    <div>
      {isError ? <b>{isError}</b> : <></>}
      <input
        type={showPass ? "password" : "text"}
        name="password"
        placeholder="create password"
        value={userPass.password}
        onChange={handleChange}
        className="border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-2.5 rounded-lg transition-all pr-10"
      />

      <aside onClick={() => setShowPass(!showPass)}>
        {showPass ? <FaRegEye /> : <FaRegEyeSlash />}
      </aside>

      <input
        type={showPass ? "password" : "text"}
        name="confirmPass"
        placeholder="create password"
        value={userPass.confirmPass}
        onChange={handleChange}
        className="border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-2.5 rounded-lg transition-all pr-10"
      />

      <button onClick={handleSubmit}>submit</button>
    </div>
  );
};

export default SetPassword;
