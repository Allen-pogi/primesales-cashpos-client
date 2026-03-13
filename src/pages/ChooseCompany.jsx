import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";

const ChooseCompany = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // 👈 get user from context
  const companies = [
    { id: "PSI", logo: "/5.png", alt: "PSI Logo" },
    { id: "OCSI", logo: "/3.png", alt: "OCSI Logo" },
  ];

  const handleSelect = (companyId) => {
    if (user?.role === "assistant") {
      navigate(`/${companyId}/assistant-report`);
    } else if (user?.role === "admin") {
      navigate(`/${companyId}/admin-report`);
    } else {
      // fallback if no role or something unexpected
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-2xl font-bold mb-6">Choose Tenant</h2>
      <div className="flex gap-8">
        {companies.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-4"
          >
            <img
              src={c.logo}
              alt={c.alt}
              className="w-24 h-24 object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChooseCompany;
