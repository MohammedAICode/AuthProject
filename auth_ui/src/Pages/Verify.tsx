import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyUser } from "../services/authService";
import Loader from "../Components/Loader/Loader";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  let [verifyInfo, setVerifyInfo] = useState({
    subOTP: "",
    email: "",
  });
  let [isError, setIsError] = useState<string | null>(null);
  let [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const email = searchParams.get("email");
    const otp = searchParams.get("otp");

    if (email) {
      setVerifyInfo((prev) => ({ ...prev, email: email }));
    }

    if (email && otp) {
      let autoRedirect = async () => {
        setIsLoading(true);
        let response = await verifyUser(email, otp);
        setIsLoading(false);

        if (!response.err) {
          navigate("/setPassword");
        } else {
          setIsError(response.message);
        }
      };
      autoRedirect();
    }
  }, [searchParams, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVerifyInfo({
      ...verifyInfo,
      subOTP: e.target.value,
    });
  }

  async function handleSubmit() {
    if (!verifyInfo.subOTP) {
      setIsError("Please enter the OTP");
      return;
    }
    setIsLoading(true);
    let response = await verifyUser(verifyInfo.email, verifyInfo.subOTP);
    setIsLoading(false);

    if (!response.err) {
      navigate("/setPassword");
    } else {
      setIsError(response.message);
    }
  }

  return (
    <div className="h-screen flex justify-center items-center bg-linear-to-br from-gray-100 to-gray-200">
      <div className="w-96 bg-white p-8 rounded-2xl shadow-lg flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Verify OTP</h2>
          <p className="text-gray-500 text-sm mt-2">
            Enter the 6-digit code sent to <br />
            <span className="font-medium text-secondary">{verifyInfo.email}</span>
          </p>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
            {isError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="number"
            name="otp"
            placeholder="000000"
            className="w-full border border-gray-300 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none p-4 rounded-xl transition-all text-center text-2xl tracking-[0.5em] font-bold appearance-none"
            value={verifyInfo.subOTP}
            onChange={handleChange}
          />

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full bg-secondary text-white py-3 rounded-xl font-medium transition-all shadow-sm flex justify-center items-center gap-2 ${
              isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-dark-light"
            }`}
          >
            {isLoading ? <Loader size="sm" /> : "Verify OTP"}
          </button>
        </div>

        <p
          className="text-sm text-center text-gray-500 cursor-pointer hover:text-secondary transition-all"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </p>
      </div>
    </div>
  );
};

export default Verify;
