import { Briefcase, Building2, ChevronLeft, ShieldCheck, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { APP_NAME } from "../config";
import { useAuth } from "../context/AuthContext";
import { getConsultantsByFirm, getFirms, login } from "../services";
import type { Consultant, Firm, InternalRole } from "../types";
import "./Login.css";

interface RoleOption {
  role: InternalRole;
  icon: LucideIcon;
  description: string;
  firmScoped: boolean;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "Super Admin",
    icon: ShieldCheck,
    description: "Platform-wide: onboards firms, views platform logs",
    firmScoped: false,
  },
  {
    role: "Company Admin",
    icon: Building2,
    description: "Runs one firm's developers, listings, and inquiries",
    firmScoped: true,
  },
  {
    role: "Broker",
    icon: Briefcase,
    description: "Commission vouchers, check release, team oversight",
    firmScoped: true,
  },
  {
    role: "Sales Manager",
    icon: Users,
    description: "Manages a team of Sales Persons and their clients",
    firmScoped: true,
  },
  {
    role: "Sales Person",
    icon: User,
    description: "Own clients, payment proofs, voucher signing",
    firmScoped: true,
  },
];

type Step = "role" | "firm" | "consultant";

export function Login() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);

  const [firms, setFirms] = useState<Firm[]>([]);
  const [loadingFirms, setLoadingFirms] = useState(false);

  const [salesPersons, setSalesPersons] = useState<Consultant[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState(false);

  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (step !== "firm" || firms.length > 0) return;
    setLoadingFirms(true);
    getFirms()
      .then(setFirms)
      .finally(() => setLoadingFirms(false));
  }, [step, firms.length]);

  async function handleSelectRole(option: RoleOption) {
    setSelectedRole(option);
    if (!option.firmScoped) {
      setSigningIn(true);
      const session = await login(option.role);
      setSigningIn(false);
      setSession(session);
      navigate("/app");
      return;
    }
    setStep("firm");
  }

  async function handleSelectFirm(firmId: string) {
    setSelectedFirmId(firmId);
    if (!selectedRole) return;

    if (selectedRole.role === "Sales Person") {
      setLoadingConsultants(true);
      const consultants = await getConsultantsByFirm(firmId);
      setLoadingConsultants(false);
      setSalesPersons(consultants.filter((c) => c.role === "Sales Person"));
      setStep("consultant");
      return;
    }

    setSigningIn(true);
    const consultants = await getConsultantsByFirm(firmId);
    const match = consultants.find((c) => c.role === selectedRole.role);
    const session = await login(selectedRole.role, firmId, match?.id);
    setSigningIn(false);
    setSession(session);
    navigate("/app");
  }

  async function handleSelectConsultant(consultantId: string) {
    if (!selectedRole || !selectedFirmId) return;
    setSigningIn(true);
    const session = await login(selectedRole.role, selectedFirmId, consultantId);
    setSigningIn(false);
    setSession(session);
    navigate("/app");
  }

  function handleBack() {
    if (step === "consultant") {
      setStep("firm");
      return;
    }
    if (step === "firm") {
      setStep("role");
      setSelectedRole(null);
      setSelectedFirmId(null);
      return;
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <ShieldCheck size={22} strokeWidth={2} aria-hidden="true" />
          <span>{APP_NAME}</span>
        </div>
        <p className="login-card__tagline">Demo sign-in — pick a role to explore the platform.</p>

        {step !== "role" ? (
          <button type="button" className="login-card__back" onClick={handleBack}>
            <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
            Back
          </button>
        ) : null}

        {step === "role" ? (
          <div className="login-card__options" role="list">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.role}
                type="button"
                className="login-role-button"
                onClick={() => handleSelectRole(option)}
                disabled={signingIn}
              >
                <option.icon size={20} strokeWidth={2} aria-hidden="true" />
                <span className="login-role-button__text">
                  <span className="login-role-button__title">{option.role}</span>
                  <span className="login-role-button__desc">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {step === "firm" ? (
          <div className="login-card__options">
            <p className="login-card__step-label">
              Choose a firm for this {selectedRole?.role}
            </p>
            {loadingFirms ? (
              <div className="login-skeleton-list">
                <div className="login-skeleton" />
                <div className="login-skeleton" />
                <div className="login-skeleton" />
              </div>
            ) : (
              firms.map((firm) => (
                <button
                  key={firm.id}
                  type="button"
                  className="login-role-button"
                  onClick={() => handleSelectFirm(firm.id)}
                  disabled={signingIn}
                >
                  <Building2 size={20} strokeWidth={2} aria-hidden="true" />
                  <span className="login-role-button__text">
                    <span className="login-role-button__title">{firm.name}</span>
                    <span className="login-role-button__desc">{firm.city}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}

        {step === "consultant" ? (
          <div className="login-card__options">
            <p className="login-card__step-label">Sign in as which Sales Person?</p>
            {loadingConsultants ? (
              <div className="login-skeleton-list">
                <div className="login-skeleton" />
                <div className="login-skeleton" />
              </div>
            ) : (
              salesPersons.map((consultant) => (
                <button
                  key={consultant.id}
                  type="button"
                  className="login-role-button"
                  onClick={() => handleSelectConsultant(consultant.id)}
                  disabled={signingIn}
                >
                  <User size={20} strokeWidth={2} aria-hidden="true" />
                  <span className="login-role-button__text">
                    <span className="login-role-button__title">{consultant.name}</span>
                    <span className="login-role-button__desc">
                      Link code: {consultant.linkCode}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}

        <Link className="login-card__public-link" to="/">
          Browse the public hub instead →
        </Link>
      </div>
    </div>
  );
}
