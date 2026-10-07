"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Shield,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  LogOut,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Cpu,
  Lock,
  Save,
  QrCode,
  FileText,
  Activity,
  UserCheck,
  Server,
  ZoomIn,
  ZoomOut,
  X,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  Menu,
  KeyRound,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

  // Admin Session State
  const [adminUser, setAdminUser] = useState<{
    adminId: string;
    username?: string;
    email?: string;
    name: string;
    role: "SUPER_ADMIN" | "ADMIN" | "VERIFIER" | "VIEWER";
  } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Change Password Modal State
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "registrations"
    | "teams"
    | "participants"
    | "payments"
    | "qr_verify"
    | "rules"
    | "event_settings"
    | "reg_settings"
    | "pay_settings"
    | "admins"
    | "activity_logs"
    | "export"
    | "health"
  >("dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterAccom, setFilterAccom] = useState("ALL");

  // Modals
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [screenshotModalUrl, setScreenshotModalUrl] = useState<string | null>(null);
  const [screenshotZoom, setScreenshotZoom] = useState(1);
  const [rejectModalTeamId, setRejectModalTeamId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [newAdminModal, setNewAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ username: "", name: "", email: "", password: "", role: "ADMIN" });

  // Rule Modals
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [newRuleModal, setNewRuleModal] = useState(false);
  const [newRuleData, setNewRuleData] = useState({
    title: "",
    badge: "",
    highlight: "",
    description: "",
    points: "",
    iconName: "ShieldCheck",
    accentColor: "rose",
    isEnabled: true,
  });

  // Settings Forms
  const [eventSettingsForm, setEventSettingsForm] = useState<any>({
    eventName: "QUANTEX MUGEN",
    tagline: "WHERE LIMITS CEASE, POSSIBILITIES BEGIN",
    eventDate: "October 30 – 31",
    venue: "KS Auditorium",
    prizePool: "₹15,000",
    registrationFee: 350,
    credits: "2EE Credits",
  });

  const [regSettingsForm, setRegSettingsForm] = useState<any>({
    maximumTeams: 100,
    registrationOpen: true,
    maintenanceMode: false,
  });

  const [paySettingsForm, setPaySettingsForm] = useState<any>({
    upiId: "owaspkare@icici",
    teamFee: 1400,
    participantFee: 350,
    paymentQrUrl: "/assets/payment-qr.png",
  });

  // Manual QR Verify State
  const [qrVerifyInput, setQrVerifyInput] = useState("");
  const [qrVerifyResult, setQrVerifyResult] = useState<any | null>(null);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Authenticate Admin Session
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.admin) {
            setAdminUser(data.admin);
          } else {
            router.push("/admin");
          }
        } else {
          router.push("/admin");
        }
      } catch {
        router.push("/admin");
      } finally {
        setCheckingAuth(false);
      }
    };
    verifySession();
  }, [router]);

  // 2. Fetch Live Dashboard Data (Parallel execution & silent auto-sync)
  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setIsSyncing(true);
    try {
      const fetchOpts: RequestInit = {
        cache: "no-store",
        credentials: "include",
      };

      const [
        statsRes,
        teamsRes,
        partRes,
        payRes,
        setRes,
        ruleRes,
        logRes,
        healthRes,
      ] = await Promise.all([
        fetch("/api/admin/stats", fetchOpts),
        fetch("/api/admin/teams", fetchOpts),
        fetch("/api/admin/participants", fetchOpts),
        fetch("/api/admin/payments", fetchOpts),
        fetch("/api/admin/settings", fetchOpts),
        fetch("/api/admin/rules", fetchOpts),
        fetch("/api/admin/activity-logs", fetchOpts),
        fetch("/api/admin/health", fetchOpts),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (teamsRes.ok) {
        const tData = await teamsRes.json();
        setTeams(tData.teams || []);
      }
      if (partRes.ok) {
        const pData = await partRes.json();
        setParticipants(pData.participants || []);
      }
      if (payRes.ok) {
        const pData = await payRes.json();
        setPayments(pData.payments || []);
      }
      if (setRes.ok && !isBackground) {
        const sData = await setRes.json();
        if (sData.event) setEventSettingsForm((prev: any) => ({ ...prev, ...sData.event }));
        if (sData.registration) setRegSettingsForm((prev: any) => ({ ...prev, ...sData.registration }));
        if (sData.payment) setPaySettingsForm((prev: any) => ({ ...prev, ...sData.payment }));
      }
      if (ruleRes.ok) {
        const rData = await ruleRes.json();
        setRulesList(rData.rules || []);
      }
      if (logRes.ok) {
        const lData = await logRes.json();
        setActivityLogs(lData.logs || []);
      }
      if (healthRes.ok) setHealthData(await healthRes.json());

      if (adminUser?.role === "SUPER_ADMIN") {
        const admRes = await fetch("/api/admin/admins", fetchOpts);
        if (admRes.ok) {
          const aData = await admRes.json();
          setAdminList(aData.admins || []);
        }
      }

      setLastSynced(new Date());
    } catch (err) {
      console.error("Failed to sync admin data:", err);
      if (!isBackground) {
        showNotification("error", "Error syncing MongoDB live records.");
      }
    } finally {
      if (!isBackground) setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchData(false);
      // Continuous 3.5s real-time sync polling
      const syncTimer = setInterval(() => {
        fetchData(true);
      }, 3500);
      return () => clearInterval(syncTimer);
    }
  }, [adminUser]);

  // Read ?tab= from URL on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const validTabs = [
        "dashboard",
        "registrations",
        "teams",
        "participants",
        "payments",
        "qr_verify",
        "rules",
        "event_settings",
        "reg_settings",
        "pay_settings",
        "admins",
        "activity_logs",
        "export",
        "health",
      ];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // Handle Logout (Destroys server session, clears browser cookies, hard redirect to /admin)
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore
    }
    // Delete cookie on client
    document.cookie = "qxm_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    document.cookie = "qxm_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    window.location.href = "/admin";
  };

  // Handle Secure Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError(null);

    if (newPasswordInput !== confirmPasswordInput) {
      setChangePassError("New password and confirmation do not match.");
      return;
    }
    if (newPasswordInput.length < 8) {
      setChangePassError("New password must be at least 8 characters.");
      return;
    }

    setChangePassLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password.");
      }
      showNotification("success", "Admin password successfully updated!");
      setChangePasswordModal(false);
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
    } catch (err: any) {
      setChangePassError(err.message || "Failed to update password.");
    } finally {
      setChangePassLoading(false);
    }
  };

  // Payment Verification Action
  const handleVerifyPayment = async (teamId: string, action: "VERIFY" | "REJECT", rejectionReason?: string) => {
    try {
      const res = await fetch("/api/admin/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action, rejectionReason }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("success", data.message || `Team ${teamId} payment updated.`);
        setRejectModalTeamId(null);
        setRejectionReasonInput("");
        fetchData();
      } else {
        showNotification("error", data.error || "Failed to update payment status.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "An error occurred.");
    }
  };

  // Save Settings
  const handleSaveSettings = async (type: "event" | "registration" | "payment") => {
    try {
      const body: any = {};
      if (type === "event") body.event = eventSettingsForm;
      if (type === "registration") body.registration = regSettingsForm;
      if (type === "payment") body.payment = paySettingsForm;

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showNotification("success", "Settings saved successfully to MongoDB Atlas.");
        fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to save settings.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error saving settings.");
    }
  };

  // Handle Team Edit Save
  const handleSaveTeamEdit = async () => {
    if (!editingTeam) return;
    try {
      const res = await fetch(`/api/admin/teams/${editingTeam.teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: editingTeam.teamName,
          paymentStatus: editingTeam.paymentStatus,
          members: editingTeam.members,
        }),
      });
      if (res.ok) {
        showNotification("success", "Team details updated successfully.");
        setEditingTeam(null);
        fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to update team.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error updating team.");
    }
  };

  // Handle Team Delete
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm(`Are you sure you want to completely remove Team ${teamId}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("success", `Team ${teamId} deleted.`);
        fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to delete team.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting team.");
    }
  };

  // Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdminData),
      });
      if (res.ok) {
        showNotification("success", "New administrator created successfully.");
        setNewAdminModal(false);
        setNewAdminData({ username: "", name: "", email: "", password: "", role: "ADMIN" });
        fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to create admin.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error creating admin.");
    }
  };

  // --- RULE MANAGEMENT HANDLERS ---
  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      });
      if (res.ok) {
        showNotification("success", `Rule ${!currentStatus ? "enabled" : "disabled"} successfully.`);
        fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to update rule status.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to update rule status.");
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pointsArray = newRuleData.points
        ? newRuleData.points.split("\n").map((p) => p.trim()).filter((p) => p.length > 0)
        : [];

      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRuleData,
          points: pointsArray,
          order: rulesList.length + 1,
        }),
      });
      if (res.ok) {
        showNotification("success", "Rule created successfully.");
        setNewRuleModal(false);
        setNewRuleData({
          title: "",
          badge: "",
          highlight: "",
          description: "",
          points: "",
          iconName: "ShieldCheck",
          accentColor: "rose",
          isEnabled: true,
        });
        fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to create rule.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error creating rule.");
    }
  };

  const handleSaveRuleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    try {
      const pointsArray = typeof editingRule.points === "string"
        ? editingRule.points.split("\n").map((p: string) => p.trim()).filter((p: string) => p.length > 0)
        : editingRule.points;

      const res = await fetch(`/api/admin/rules/${editingRule._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingRule,
          points: pointsArray,
        }),
      });
      if (res.ok) {
        showNotification("success", "Rule updated successfully.");
        setEditingRule(null);
        fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to update rule.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error updating rule.");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      const res = await fetch(`/api/admin/rules/${ruleId}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("success", "Rule deleted.");
        fetchData();
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to delete rule.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting rule.");
    }
  };

  const handleMoveRule = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rulesList.length) return;

    const newRules = [...rulesList];
    const temp = newRules[index];
    newRules[index] = newRules[targetIndex];
    newRules[targetIndex] = temp;

    const orderedIds = newRules.map((r) => r._id);
    try {
      const res = await fetch("/api/admin/rules/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        showNotification("success", "Rules reordered.");
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to reorder rules.");
    }
  };


  // Helper for matching Year and Accommodation across variants (Roman, numeric, and labels)
  const checkYearMatch = (filterY: string, actualY?: string) => {
    if (!filterY || filterY === "ALL") return true;
    if (!actualY) return false;
    const f = filterY.trim().toUpperCase();
    const a = String(actualY).trim().toUpperCase();
    if (f === a) return true;
    if ((f === "I" || f.includes("1")) && (a === "I" || a.includes("1"))) return true;
    if ((f === "II" || f.includes("2")) && (a === "II" || a.includes("2"))) return true;
    if ((f === "III" || f.includes("3")) && (a === "III" || a.includes("3"))) return true;
    if ((f === "IV" || f.includes("4")) && (a === "IV" || a.includes("4"))) return true;
    return false;
  };

  const checkAccomMatch = (filterA: string, actualA?: string) => {
    if (!filterA || filterA === "ALL") return true;
    if (!actualA) return false;
    const f = filterA.toLowerCase();
    const a = String(actualA).toLowerCase();
    if (f.includes("hostel") && a.includes("hostel")) return true;
    if (f.includes("day") && a.includes("day")) return true;
    return f === a;
  };

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        t.teamId.toLowerCase().includes(term) ||
        t.teamName.toLowerCase().includes(term) ||
        t.teamLeadEmail.toLowerCase().includes(term) ||
        t.members?.some(
          (m: any) =>
            m.name?.toLowerCase().includes(term) ||
            m.registrationNumber?.toLowerCase().includes(term) ||
            m.mobile?.toLowerCase().includes(term)
        );

      const matchesPayment = filterPayment === "ALL" || t.paymentStatus === filterPayment;
      const matchesDept = filterDept === "ALL" || t.members?.some((m: any) => m.department === filterDept);
      const matchesYear = filterYear === "ALL" || t.members?.some((m: any) => checkYearMatch(filterYear, m.year));
      const matchesAccom = filterAccom === "ALL" || t.members?.some((m: any) => checkAccomMatch(filterAccom, m.accommodation));

      return matchesSearch && matchesPayment && matchesDept && matchesYear && matchesAccom;
    });
  }, [teams, searchTerm, filterPayment, filterDept, filterYear, filterAccom]);

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.registrationNumber?.toLowerCase().includes(term) ||
        p.generatedCollegeEmail?.toLowerCase().includes(term) ||
        p.mobile?.toLowerCase().includes(term) ||
        p.teamId?.toLowerCase().includes(term);

      const matchesDept = filterDept === "ALL" || p.department === filterDept;
      const matchesYear = filterYear === "ALL" || checkYearMatch(filterYear, p.year);
      const matchesAccom = filterAccom === "ALL" || checkAccomMatch(filterAccom, p.accommodation);

      return matchesSearch && matchesDept && matchesYear && matchesAccom;
    });
  }, [participants, searchTerm, filterDept, filterYear, filterAccom]);

  // Manual QR verify search
  const handleManualQrVerify = () => {
    const id = qrVerifyInput.trim().toUpperCase();
    const team = teams.find((t) => t.teamId.toUpperCase() === id);
    if (team) {
      setQrVerifyResult({
        verified: team.paymentStatus === "VERIFIED",
        team,
      });
    } else {
      setQrVerifyResult({
        verified: false,
        notFound: true,
      });
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center font-mono text-xs text-rose-400">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="tracking-widest">AUTHENTICATING QUANTEX MUGEN ADMIN SESSION...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col md:flex-row overflow-x-hidden font-sans">
      
      {/* ===================================================================== */}
      {/* SIDEBAR NAVIGATION (Desktop Fixed, Mobile Responsive Drawer) */}
      {/* ===================================================================== */}
      <aside className="w-full md:w-64 lg:w-72 bg-black/80 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0 z-40">
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-7 w-28 filter drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]">
              <Image
                src="/assets/quantex-black-redglow.png"
                alt="QUANTEX MUGEN"
                fill
                sizes="(max-width: 768px) 112px, 112px"
                priority
                unoptimized
                className="object-contain"
              />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold tracking-widest border border-rose-500/30">
              ADMIN
            </span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Current Admin Profile */}
        <div className="px-4 py-3 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
              {adminUser?.name?.charAt(0) || "A"}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{adminUser?.name}</p>
              <p className="text-[10px] text-rose-400 font-mono">{adminUser?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChangePasswordModal(true)}
              title="Change Admin Password"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => fetchData(false)}
              title="Refresh Real-Time Data"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          className={`${
            mobileMenuOpen ? "flex" : "hidden md:flex"
          } flex-col flex-1 p-3 space-y-1 font-mono text-xs overflow-y-auto max-h-[calc(100vh-140px)]`}
        >
          <button
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "dashboard"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold shadow-[0_0_15px_rgba(225,29,72,0.2)]"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab("registrations"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "registrations"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Registrations</span>
          </button>

          <button
            onClick={() => { setActiveTab("teams"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "teams"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Teams ({teams.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("participants"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "participants"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Participants ({participants.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("payments"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "payments"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Payments</span>
            </div>
            {stats?.pendingPayments > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-bold animate-pulse">
                {stats.pendingPayments}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("qr_verify"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "qr_verify"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
            <span>QR Verification</span>
          </button>

          {/* Divider */}
          <div className="pt-2 pb-1">
            <span className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
              Configuration
            </span>
          </div>

          <button
            onClick={() => { setActiveTab("rules"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "rules"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold shadow-[0_0_15px_rgba(225,29,72,0.2)]"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Rules & Guidelines</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-[10px] font-mono">
              {rulesList.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("event_settings"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "event_settings"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Event Settings</span>
          </button>

          <button
            onClick={() => { setActiveTab("reg_settings"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "reg_settings"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Lock className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Capacity Settings</span>
          </button>

          <button
            onClick={() => { setActiveTab("pay_settings"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "pay_settings"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Payment Settings</span>
          </button>

          {adminUser?.role === "SUPER_ADMIN" && (
            <button
              onClick={() => { setActiveTab("admins"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                activeTab === "admins"
                  ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <UserCheck className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Admin Management</span>
            </button>
          )}

          <button
            onClick={() => { setActiveTab("activity_logs"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "activity_logs"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Activity className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Activity Logs</span>
          </button>

          <button
            onClick={() => { setActiveTab("export"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "export"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Download className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Export Center</span>
          </button>

          <button
            onClick={() => { setActiveTab("health"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
              activeTab === "health"
                ? "bg-rose-600/20 text-white border border-rose-500/40 font-bold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>System Health</span>
          </button>

          {/* Logout */}
          <div className="pt-4 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer border border-red-500/20"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ===================================================================== */}
      {/* MAIN ADMIN CONTENT AREA */}
      {/* ===================================================================== */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Notification Toast */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-mono flex items-center justify-between shadow-2xl ${
              notification.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : "bg-red-950/80 border-red-500/50 text-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson">
                  COMMAND DASHBOARD
                </h2>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  Live real-time telemetry from MongoDB Atlas Production Database.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                  <span className={`w-2 h-2 rounded-full ${isSyncing ? "bg-amber-400 animate-spin" : "bg-emerald-400 animate-ping"}`} />
                  <span>ATLAS SYNC {isSyncing ? "SYNCING..." : "LIVE"}</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    ({lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })})
                  </span>
                </span>
                <button
                  onClick={() => fetchData(false)}
                  title="Force Instant Sync from MongoDB Atlas"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || loading ? "animate-spin text-rose-400" : ""}`} />
                  <span>SYNC NOW</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Teams */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl">
                <span className="text-[11px] font-mono text-gray-400 uppercase block">Total Teams</span>
                <span className="text-3xl sm:text-4xl font-black text-white font-mono mt-1 block">
                  {stats?.totalTeams ?? 0}
                </span>
                <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                  {stats?.totalParticipants ?? 0} Participants Registered
                </span>
              </div>

              {/* Verified Registrations */}
              <div className="p-5 rounded-2xl bg-black/60 border border-emerald-500/30 backdrop-blur-xl">
                <span className="text-[11px] font-mono text-emerald-400 uppercase block">Verified Payments</span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-300 font-mono mt-1 block">
                  {stats?.verifiedPayments ?? 0}
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono mt-1 block">
                  ₹{(stats?.totalRevenue ?? 0).toLocaleString()} Collected
                </span>
              </div>

              {/* Pending Verifications */}
              <div className="p-5 rounded-2xl bg-black/60 border border-amber-500/30 backdrop-blur-xl">
                <span className="text-[11px] font-mono text-amber-400 uppercase block">Pending Verification</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono mt-1 block">
                  {stats?.pendingPayments ?? 0}
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono mt-1 block">
                  Awaiting UTR Approval
                </span>
              </div>

              {/* Available Slots */}
              <div className="p-5 rounded-2xl bg-black/60 border border-rose-500/30 backdrop-blur-xl">
                <span className="text-[11px] font-mono text-rose-400 uppercase block">Remaining Slots</span>
                <span className="text-3xl sm:text-4xl font-black text-rose-300 font-mono mt-1 block">
                  {stats?.availableSlots ?? 0} / {stats?.maximumTeams ?? 100}
                </span>
                <span className="text-[10px] text-rose-400/80 font-mono mt-1 block">
                  {stats?.occupiedSlots ?? 0} Teams Reserved/Active
                </span>
              </div>
            </div>

            {/* Distribution Charts & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Payment Status Breakdown */}
              <div className="p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  <span>PAYMENT STATUS DISTRIBUTION</span>
                </h3>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center text-emerald-300">
                    <span>Verified</span>
                    <span className="font-bold">{stats?.distributions?.payments?.VERIFIED ?? 0}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${((stats?.distributions?.payments?.VERIFIED || 0) / Math.max(1, stats?.totalTeams || 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-amber-300 pt-2">
                    <span>Pending Proof</span>
                    <span className="font-bold">{stats?.distributions?.payments?.PENDING ?? 0}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${((stats?.distributions?.payments?.PENDING || 0) / Math.max(1, stats?.totalTeams || 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-red-300 pt-2">
                    <span>Rejected</span>
                    <span className="font-bold">{stats?.distributions?.payments?.REJECTED ?? 0}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${((stats?.distributions?.payments?.REJECTED || 0) / Math.max(1, stats?.totalTeams || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>DEPARTMENT DISTRIBUTION</span>
                </h3>
                <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-1">
                  {Object.entries(stats?.distributions?.department || {}).map(([dept, count]: any) => (
                    <div key={dept} className="flex justify-between p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-gray-300">{dept}</span>
                      <span className="font-bold text-cyan-400">{count}</span>
                    </div>
                  ))}
                  {Object.keys(stats?.distributions?.department || {}).length === 0 && (
                    <span className="text-gray-500 text-xs">No student data yet.</span>
                  )}
                </div>
              </div>

              {/* Year & Accommodation Breakdown */}
              <div className="p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>ACCOMMODATION & YEAR</span>
                </h3>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1 font-bold">Accommodation</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-white/[0.03] text-center border border-white/5">
                        <span className="text-[10px] text-gray-400 block">Day Scholar</span>
                        <span className="font-bold text-white text-sm">
                          {stats?.distributions?.accommodation?.["Day Scholar"] ?? 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03] text-center border border-white/5">
                        <span className="text-[10px] text-amber-400/80 block">Hosteller</span>
                        <span className="font-bold text-amber-300 text-sm">
                          {stats?.distributions?.accommodation?.["Hosteller"] ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-400 block mb-1 font-bold">Academic Year</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {[
                        { title: "1st Yr", code: "I", full: "1st Year" },
                        { title: "2nd Yr", code: "II", full: "2nd Year" },
                        { title: "3rd Yr", code: "III", full: "3rd Year" },
                        { title: "4th Yr", code: "IV", full: "4th Year" },
                      ].map((yr) => {
                        const count =
                          stats?.distributions?.year?.[yr.code] ??
                          stats?.distributions?.year?.[yr.full] ??
                          0;
                        return (
                          <div key={yr.code} className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <span className="text-[9px] text-gray-400 block">{yr.code}</span>
                            <span className="font-bold text-white text-xs">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-black/80 to-black/90 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase font-sans">
                  QUICK ADMINISTRATION DISPATCH
                </h3>
                <p className="text-xs font-mono text-gray-400 mt-0.5">
                  Verify payments, inspect team records, or export attendee spreadsheets.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setActiveTab("payments")}
                  className="px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold cursor-pointer transition-colors"
                >
                  Verify Payments ({stats?.pendingPayments ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab("export")}
                  className="px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold cursor-pointer transition-colors"
                >
                  Export CSV Records
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 2: REGISTRATIONS & TEAMS TABLE */}
        {/* ------------------------------------------------------------------- */}
        {(activeTab === "registrations" || activeTab === "teams") && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson">
                  TEAM REGISTRATIONS ({filteredTeams.length})
                </h2>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  Manage registered hackathon squads, member rosters, and payment statuses.
                </p>
              </div>
              <button
                onClick={() => fetchData(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Reload</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Team ID, Name, Reg No, Mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-rose-500/60"
                />
              </div>

              {/* Payment Status Filter */}
              <div>
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white focus:outline-none"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="UNPAID">UNPAID</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="AI&DS">AI&DS</option>
                  <option value="CS&IT">CS&IT</option>
                </select>
              </div>

              {/* Accommodation Filter */}
              <div>
                <select
                  value={filterAccom}
                  onChange={(e) => setFilterAccom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white focus:outline-none"
                >
                  <option value="ALL">All Accommodations</option>
                  <option value="Day Scholar">Day Scholar</option>
                  <option value="Hosteller">Hosteller</option>
                </select>
              </div>
            </div>

            {/* Teams Table */}
            <div className="rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Team ID</th>
                      <th className="py-3.5 px-4">Team Name</th>
                      <th className="py-3.5 px-4">Team Lead</th>
                      <th className="py-3.5 px-4">Members (4)</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">UTR / Amount</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-gray-200">
                    {filteredTeams.map((t) => (
                      <tr key={t.teamId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-rose-400">{t.teamId}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{t.teamName}</td>
                        <td className="py-3.5 px-4 text-gray-300">
                          <span className="block truncate max-w-[180px]">{t.teamLeadEmail}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {t.members?.map((m: any, i: number) => (
                              <div key={i} className="text-[11px] text-gray-300">
                                <span className="text-white font-medium">{m.name}</span>{" "}
                                <span className="text-gray-500">({m.registrationNumber})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              t.paymentStatus === "VERIFIED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : t.paymentStatus === "PENDING"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : t.paymentStatus === "REJECTED"
                                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                : "bg-gray-500/20 text-gray-300 border border-gray-500/40"
                            }`}
                          >
                            {t.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {t.payment ? (
                            <div>
                              <span className="text-white font-bold block">{t.payment.utr}</span>
                              <span className="text-[10px] text-gray-400">₹{t.payment.amount || 1400}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Modal */}
                            <button
                              onClick={() => setSelectedTeam(t)}
                              title="View Full Details"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* View Pass */}
                            <Link
                              href={`/pass/${t.teamId}`}
                              target="_blank"
                              title="View Event Pass"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </Link>

                            {/* Edit */}
                            {adminUser?.role !== "VIEWER" && (
                              <button
                                onClick={() => setEditingTeam({ ...t })}
                                title="Edit Team"
                                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete (SUPER_ADMIN only) */}
                            {adminUser?.role === "SUPER_ADMIN" && (
                              <button
                                onClick={() => handleDeleteTeam(t.teamId)}
                                title="Delete Team"
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTeams.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          No matching team registrations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 3: PARTICIPANTS DIRECTORY */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "participants" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-cyan">
                  PARTICIPANTS DIRECTORY ({filteredParticipants.length})
                </h2>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  Individual student attendee profiles, college IDs, and hostel designations.
                </p>
              </div>
              <button
                onClick={() => fetchData(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Reload</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Student Name, Reg No..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white"
                >
                  <option value="ALL">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="AI&DS">AI&DS</option>
                  <option value="CS&IT">CS&IT</option>
                </select>
              </div>

              <div>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white focus:outline-none"
                >
                  <option value="ALL">All Academic Years</option>
                  <option value="I">1st Year (I)</option>
                  <option value="II">2nd Year (II)</option>
                  <option value="III">3rd Year (III)</option>
                  <option value="IV">4th Year (IV)</option>
                </select>
              </div>

              <div>
                <select
                  value={filterAccom}
                  onChange={(e) => setFilterAccom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-white/10 text-white focus:outline-none"
                >
                  <option value="ALL">All Accommodations</option>
                  <option value="Day Scholar">Day Scholar</option>
                  <option value="Hosteller">Hosteller</option>
                </select>
              </div>
            </div>

            {/* Participants Table */}
            <div className="rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Reg No</th>
                      <th className="py-3.5 px-4">Team ID</th>
                      <th className="py-3.5 px-4">Dept / Year / Sec</th>
                      <th className="py-3.5 px-4">Mobile</th>
                      <th className="py-3.5 px-4">Gender</th>
                      <th className="py-3.5 px-4">Accommodation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-gray-200">
                    {filteredParticipants.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                        <td className="py-3 px-4 text-rose-400 font-bold">{p.registrationNumber}</td>
                        <td className="py-3 px-4 font-bold text-cyan-300">{p.teamId}</td>
                        <td className="py-3 px-4 text-gray-300">
                          {p.department} • {p.year} • Sec {p.section}
                        </td>
                        <td className="py-3 px-4">{p.mobile}</td>
                        <td className="py-3 px-4">{p.gender}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] ${
                              p.accommodation === "Hosteller"
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                : "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {p.accommodation} {p.hostel ? `(${p.hostel} ${p.roomNumber || ""})` : ""}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          No matching participant records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 4: PAYMENTS & CLOUDINARY VERIFICATION */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-amber">
                  PAYMENT VERIFICATION VAULT ({payments.length})
                </h2>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  Inspect Cloudinary payment screenshots, validate 12-digit UTRs, and approve records.
                </p>
              </div>
              <button
                onClick={() => fetchData(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Reload</span>
              </button>
            </div>

            {/* Payments Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payments.map((p) => (
                <div
                  key={p._id}
                  className={`p-6 rounded-3xl bg-black/60 border backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all ${
                    p.paymentStatus === "VERIFIED"
                      ? "border-emerald-500/30 hover:border-emerald-500/60"
                      : p.paymentStatus === "PENDING"
                      ? "border-amber-500/40 hover:border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.15)]"
                      : "border-red-500/30 hover:border-red-500/60"
                  }`}
                >
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-400">{p.teamId}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.paymentStatus === "VERIFIED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : p.paymentStatus === "PENDING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">12-Digit UTR</span>
                      <span className="text-base font-black text-white font-mono tracking-widest">{p.utr}</span>
                    </div>

                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Amount: <strong className="text-emerald-400">₹{p.amount || 1400}</strong></span>
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Screenshot Preview Box */}
                    {p.screenshotUrl && (
                      <div
                        onClick={() => {
                          setScreenshotModalUrl(p.screenshotUrl);
                          setScreenshotZoom(1);
                        }}
                        className="relative w-full h-36 rounded-xl overflow-hidden bg-black border border-white/10 cursor-pointer group flex items-center justify-center"
                      >
                        <Image
                          src={p.screenshotUrl}
                          alt={`Proof ${p.teamId}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-bold">
                          <ZoomIn className="w-4 h-4" />
                          <span>Click to Zoom Proof</span>
                        </div>
                      </div>
                    )}

                    {p.rejectionReason && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] text-red-300">
                        <strong>Reason:</strong> {p.rejectionReason}
                      </div>
                    )}

                    {p.verifiedBy && (
                      <span className="text-[10px] text-gray-500 block">
                        Verified by: {p.verifiedBy}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {adminUser?.role !== "VIEWER" && p.paymentStatus === "PENDING" && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono text-xs">
                      <button
                        onClick={() => handleVerifyPayment(p.teamId, "VERIFY")}
                        className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>APPROVE</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectModalTeamId(p.teamId);
                          setRejectionReasonInput("");
                        }}
                        className="py-2.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>REJECT</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {payments.length === 0 && (
                <div className="col-span-3 py-12 text-center font-mono text-gray-500">
                  No payment submissions recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 5: QR VERIFICATION */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "qr_verify" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson font-sans">
                PASS & QR VERIFICATION CONSOLE
              </h2>
              <p className="text-xs font-mono text-gray-400 mt-1">
                Scan or manually enter Team ID to check participant event credentials.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-6">
              <div className="space-y-2 font-mono">
                <label className="text-xs font-bold text-gray-300 uppercase">
                  ENTER TEAM ID (e.g. QXM-001)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrVerifyInput}
                    onChange={(e) => setQrVerifyInput(e.target.value)}
                    placeholder="QXM-001"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-white uppercase font-bold tracking-widest text-sm focus:outline-none focus:border-rose-500/60"
                  />
                  <button
                    onClick={handleManualQrVerify}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    VERIFY
                  </button>
                </div>
              </div>

              {/* Result Display */}
              {qrVerifyResult && (
                <div
                  className={`p-6 rounded-2xl border font-mono space-y-4 ${
                    qrVerifyResult.verified
                      ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
                      : "bg-red-950/40 border-red-500/60 text-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {qrVerifyResult.verified ? (
                      <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400 shrink-0" />
                    )}
                    <div>
                      <h3 className="text-lg font-black tracking-wider uppercase">
                        {qrVerifyResult.verified ? "✓ VERIFIED PASS" : "✕ NOT VERIFIED / INVALID"}
                      </h3>
                      <p className="text-xs text-gray-300">
                        {qrVerifyResult.verified
                          ? "Participant squad is fully registered and payment verified for Quantex Mugen."
                          : qrVerifyResult.notFound
                          ? "Team ID not found in database records."
                          : "Payment is unverified, pending, or rejected."}
                      </p>
                    </div>
                  </div>

                  {qrVerifyResult.team && (
                    <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Team:</span>
                        <span className="text-white font-bold">{qrVerifyResult.team.teamName} ({qrVerifyResult.team.teamId})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lead:</span>
                        <span className="text-white">{qrVerifyResult.team.teamLeadEmail}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-gray-400 block mb-1">Roster (4/4):</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {qrVerifyResult.team.members?.map((m: any, i: number) => (
                            <div key={i} className="p-1.5 rounded bg-black/40 text-[11px] text-gray-200">
                              {m.name} ({m.registrationNumber})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB: RULES & GUIDELINES MANAGEMENT */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson font-sans">
                  RULES & GUIDELINES MANAGEMENT
                </h2>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  Manage, reorder, edit, and toggle rules displayed on the QUANTEX MUGEN homepage.
                </p>
              </div>

              {adminUser?.role !== "VIEWER" && (
                <button
                  onClick={() => setNewRuleModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)] cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD NEW RULE</span>
                </button>
              )}
            </div>

            {/* Rules Cards List */}
            <div className="space-y-4">
              {rulesList.map((rule, idx) => (
                <div
                  key={rule._id || idx}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                    rule.isEnabled
                      ? "bg-[#0b1022]/80 border-white/15 hover:border-rose-500/40"
                      : "bg-black/40 border-white/5 opacity-60"
                  } backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono`}
                >
                  {/* Left: Reorder & Badge */}
                  <div className="flex items-start md:items-center gap-3">
                    {/* Reorder Arrows */}
                    {adminUser?.role !== "VIEWER" && (
                      <div className="flex flex-col gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveRule(idx, "up")}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          disabled={idx === rulesList.length - 1}
                          onClick={() => handleMoveRule(idx, "down")}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                          {rule.badge || `RULE ${idx + 1}`}
                        </span>
                        <span className="text-[10px] text-gray-400">Order #{idx + 1}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          rule.isEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-400"
                        }`}>
                          {rule.isEnabled ? "ACTIVE" : "DISABLED"}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                        {rule.title}
                      </h3>

                      {rule.highlight && (
                        <p className="text-xs text-rose-400 font-bold mt-0.5">
                          {rule.highlight}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 font-sans mt-1 line-clamp-2 max-w-2xl">
                        {rule.description}
                      </p>

                      {rule.points && rule.points.length > 0 && (
                        <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{rule.points.length} bullet points configured</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {adminUser?.role !== "VIEWER" && (
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleToggleRule(rule._id, rule.isEnabled)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          rule.isEnabled
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                            : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                        }`}
                      >
                        {rule.isEnabled ? "Disable" : "Enable"}
                      </button>

                      <button
                        onClick={() => setEditingRule({ ...rule, points: (rule.points || []).join("\n") })}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                        title="Edit Rule"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteRule(rule._id)}
                        className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {rulesList.length === 0 && (
                <div className="p-12 text-center rounded-3xl bg-black/40 border border-white/10 font-mono text-gray-500 text-xs">
                  No rules configured yet. Click "Add New Rule" above to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 6: EVENT SETTINGS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "event_settings" && (
          <div className="max-w-3xl mx-auto space-y-6 font-mono">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson font-sans">
                EVENT SETTINGS
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Configure official parameters displayed dynamically across the Quantex Mugen portal.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">EVENT NAME</label>
                  <input
                    type="text"
                    value={eventSettingsForm.eventName}
                    onChange={(e) => setEventSettingsForm({ ...eventSettingsForm, eventName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">EVENT DATES</label>
                  <input
                    type="text"
                    value={eventSettingsForm.eventDate}
                    onChange={(e) => setEventSettingsForm({ ...eventSettingsForm, eventDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">TAGLINE</label>
                <input
                  type="text"
                  value={eventSettingsForm.tagline}
                  onChange={(e) => setEventSettingsForm({ ...eventSettingsForm, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">VENUE</label>
                  <input
                    type="text"
                    value={eventSettingsForm.venue}
                    onChange={(e) => setEventSettingsForm({ ...eventSettingsForm, venue: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">PRIZE POOL</label>
                  <input
                    type="text"
                    value={eventSettingsForm.prizePool}
                    onChange={(e) => setEventSettingsForm({ ...eventSettingsForm, prizePool: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">ACADEMIC CREDITS</label>
                  <input
                    type="text"
                    value={eventSettingsForm.credits}
                    onChange={(e) => setEventSettingsForm({ ...eventSettingsForm, credits: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  />
                </div>
              </div>

              {adminUser?.role !== "VIEWER" && (
                <button
                  onClick={() => handleSaveSettings("event")}
                  className="mt-4 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE EVENT CONFIGURATION</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 7: REGISTRATION CAPACITY SETTINGS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "reg_settings" && (
          <div className="max-w-4xl mx-auto space-y-6 font-mono">
            {/* Title & Live Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson font-sans">
                  CAPACITY & REGISTRATION CONTROLS
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Adjust team capacity limits, toggle registration open/closed status, and configure squad pricing.
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                    regSettingsForm.registrationOpen
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-red-500/15 border-red-500/40 text-red-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      regSettingsForm.registrationOpen ? "bg-emerald-400 animate-ping" : "bg-red-400"
                    }`}
                  />
                  <span>PORTAL {regSettingsForm.registrationOpen ? "OPEN FOR ENTRIES" : "REGISTRATIONS CLOSED"}</span>
                </span>
              </div>
            </div>

            {/* Live Capacity Telemetry Box */}
            <div className="p-5 sm:p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block">CURRENT REGISTRATION LOAD</span>
                  <p className="text-lg font-bold text-white font-sans mt-0.5">
                    {stats?.occupiedSlots ?? 0} Teams Filled of {regSettingsForm.maximumTeams ?? 100} Maximum Slots
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block">AVAILABLE SLOTS REMAINING</span>
                  <p className="text-lg font-black text-rose-400 font-mono mt-0.5">
                    {Math.max(0, (regSettingsForm.maximumTeams ?? 100) - (stats?.occupiedSlots ?? 0))} SLOTS
                  </p>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-rose-600 via-rose-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(225,29,72,0.8)]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(3, ((stats?.occupiedSlots ?? 0) / Math.max(1, regSettingsForm.maximumTeams ?? 100)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Master Registration Open / Close Switch */}
            <div className="p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-5 text-xs">
              <div>
                <label className="text-gray-200 block text-sm font-bold uppercase tracking-wider mb-1">
                  1. REGISTRATION PORTAL STATUS
                </label>
                <p className="text-gray-400 text-xs">
                  Instantly open or lock hackathon registrations for all students across the web application.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* OPEN Button */}
                <button
                  type="button"
                  onClick={() => setRegSettingsForm({ ...regSettingsForm, registrationOpen: true })}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                    regSettingsForm.registrationOpen
                      ? "bg-emerald-950/50 border-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/[0.05]"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      regSettingsForm.registrationOpen ? "bg-emerald-500 text-black font-bold" : "bg-white/10"
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <span className="font-black text-sm block text-emerald-400">OPEN REGISTRATIONS</span>
                    <span className="text-[11px] text-gray-300 block mt-0.5">
                      Accept new team entries, issue 5-minute reservation timers, and allow payment uploads.
                    </span>
                  </div>
                </button>

                {/* CLOSED Button */}
                <button
                  type="button"
                  onClick={() => setRegSettingsForm({ ...regSettingsForm, registrationOpen: false })}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                    !regSettingsForm.registrationOpen
                      ? "bg-red-950/60 border-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.3)] ring-1 ring-red-400"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/[0.05]"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      !regSettingsForm.registrationOpen ? "bg-red-500 text-white font-bold" : "bg-white/10"
                    }`}
                  >
                    ✕
                  </div>
                  <div>
                    <span className="font-black text-sm block text-red-400">CLOSE REGISTRATIONS</span>
                    <span className="text-[11px] text-gray-300 block mt-0.5">
                      Lock the registration portal and display "Registrations Closed / Slots Full" on landing page.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Capacity Limit Configuration */}
            <div className="p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-5 text-xs">
              <div>
                <label className="text-gray-200 block text-sm font-bold uppercase tracking-wider mb-1">
                  2. MAXIMUM TEAM REGISTRATION CAPACITY
                </label>
                <p className="text-gray-400 text-xs">
                  Set the total maximum number of teams permitted to register for QUANTEX MUGEN.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={regSettingsForm.maximumTeams}
                    onChange={(e) =>
                      setRegSettingsForm({ ...regSettingsForm, maximumTeams: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-48 px-4 py-3 rounded-xl bg-black border-2 border-rose-500/50 text-white font-mono text-base font-bold focus:border-rose-400 focus:outline-none"
                  />
                  <span className="text-gray-400 font-bold uppercase">TEAMS TOTAL</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-gray-400 mr-1 font-bold">Quick Presets:</span>
                  {[50, 75, 100, 120, 150, 200].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRegSettingsForm({ ...regSettingsForm, maximumTeams: preset })}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                        regSettingsForm.maximumTeams === preset
                          ? "bg-rose-600 text-white border-rose-400 font-bold"
                          : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {preset} Teams
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fee & Squad Rules Breakdown */}
            <div className="p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4 text-xs">
              <label className="text-gray-200 block text-sm font-bold uppercase tracking-wider mb-1">
                3. SQUAD FEE & TIMEOUT SPECIFICATIONS
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <span className="text-[10px] text-gray-400 block uppercase">TEAM SIZE REQUIRED</span>
                  <span className="text-base font-bold text-white block mt-1">4 Members / Squad</span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">Fixed official rule</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <span className="text-[10px] text-gray-400 block uppercase">FEE PER PARTICIPANT</span>
                  <span className="text-base font-bold text-emerald-400 block mt-1">₹350 / Member</span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">₹1,400 Total per Team</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <span className="text-[10px] text-gray-400 block uppercase">SEAT RESERVATION TIMER</span>
                  <span className="text-base font-bold text-amber-400 block mt-1">5 Minutes</span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">Auto-releases slot if unpaid</span>
                </div>
              </div>

              {/* Save Settings Action Button */}
              {adminUser?.role !== "VIEWER" && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <p className="text-[11px] text-gray-400 font-mono">
                    Changes apply instantly across all visitor screens via real-time cache invalidation.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings("registration")}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-transform hover:scale-105"
                  >
                    <Save className="w-4 h-4" />
                    <span>SAVE CAPACITY SETTINGS</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 8: PAYMENT SETTINGS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "pay_settings" && (
          <div className="max-w-3xl mx-auto space-y-6 font-mono">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-amber font-sans">
                PAYMENT SETTINGS
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Configure event registration fees, recipient UPI ID, and QR code assets.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">RECIPIENT UPI ID</label>
                  <input
                    type="text"
                    value={paySettingsForm.upiId}
                    onChange={(e) => setPaySettingsForm({ ...paySettingsForm, upiId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">TEAM FEE (₹)</label>
                  <input
                    type="number"
                    value={paySettingsForm.teamFee}
                    onChange={(e) => setPaySettingsForm({ ...paySettingsForm, teamFee: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">QR CODE IMAGE PATH / CLOUDINARY URL</label>
                <input
                  type="text"
                  value={paySettingsForm.paymentQrUrl}
                  onChange={(e) => setPaySettingsForm({ ...paySettingsForm, paymentQrUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white"
                />
              </div>

              {adminUser?.role !== "VIEWER" && (
                <button
                  onClick={() => handleSaveSettings("payment")}
                  className="mt-4 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE PAYMENT PARAMETERS</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 9: ADMIN MANAGEMENT (SUPER_ADMIN ONLY) */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "admins" && adminUser?.role === "SUPER_ADMIN" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson">
                  ADMINISTRATOR ACCOUNTS ({adminList.length})
                </h2>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  Manage privileged administrator credentials and role-based permissions.
                </p>
              </div>
              <button
                onClick={() => setNewAdminModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Admin</span>
              </button>
            </div>

            {/* Admin Accounts Table */}
            <div className="rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-gray-200">
                    {adminList.map((adm) => (
                      <tr key={adm._id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-bold text-white">{adm.name}</td>
                        <td className="py-3 px-4 text-rose-400">{adm.email}</td>
                        <td className="py-3 px-4 font-bold text-amber-300">{adm.role}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              adm.isActive
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-red-500/20 text-red-300 border border-red-500/40"
                            }`}
                          >
                            {adm.isActive ? "ACTIVE" : "DISABLED"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {adm.lastLogin ? new Date(adm.lastLogin).toLocaleString() : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 10: ACTIVITY LOGS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "activity_logs" && (
          <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson font-sans">
                  ACTIVITY AUDIT TRAIL ({activityLogs.length})
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Chronological tamper-evident audit logs of administrative actions.
                </p>
              </div>
              <button
                onClick={() => fetchData(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Admin</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-gray-300">
                    {activityLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 text-gray-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-white font-bold">{log.adminEmail}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-rose-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-amber-300">{log.targetRecord || "—"}</td>
                        <td className="py-2.5 px-4 text-gray-500 text-[10px]">{log.ip || "Localhost"}</td>
                      </tr>
                    ))}
                    {activityLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No activity records logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 11: EXPORT CENTER */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "export" && (
          <div className="max-w-3xl mx-auto space-y-6 font-mono">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-cyan font-sans">
                DATA EXPORT CENTER
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Download filtered hackathon attendee datasets in CSV or JSON format.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Export All Teams */}
              <div className="p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white uppercase">TEAM REGISTRATIONS</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Export all team rosters, leaders, and verification states.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/api/admin/export?type=teams&format=csv"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV SPREADSHEET</span>
                  </a>
                  <a
                    href="/api/admin/export?type=teams&format=json"
                    target="_blank"
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
                  >
                    JSON
                  </a>
                </div>
              </div>

              {/* Export Participants */}
              <div className="p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white uppercase">ALL PARTICIPANTS</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Individual student names, registration numbers, departments & hostels.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/api/admin/export?type=participants&format=csv"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV SPREADSHEET</span>
                  </a>
                  <a
                    href="/api/admin/export?type=participants&format=json"
                    target="_blank"
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
                  >
                    JSON
                  </a>
                </div>
              </div>

              {/* Export Verified Attendees */}
              <div className="p-6 rounded-3xl bg-black/60 border border-emerald-500/30 backdrop-blur-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-emerald-300 uppercase">VERIFIED ATTENDEES ONLY</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Filtered list of all students whose team payments are approved.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/api/admin/export?type=verified_participants&format=csv"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>VERIFIED CSV</span>
                  </a>
                </div>
              </div>

              {/* Export Payments */}
              <div className="p-6 rounded-3xl bg-black/60 border border-amber-500/30 backdrop-blur-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-amber-300 uppercase">PAYMENTS & UTR RECORDS</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Financial audit records, 12-digit UTRs, and approval timestamps.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/api/admin/export?type=payments&format=csv"
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PAYMENTS CSV</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 12: SYSTEM HEALTH DIAGNOSTICS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === "health" && (
          <div className="max-w-3xl mx-auto space-y-6 font-mono">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson font-sans">
                SYSTEM HEALTH & STATUS
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Real-time operational status of backend services and database connections.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Database */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block">Database Cluster</span>
                    <span className="font-bold text-white text-sm">MongoDB Atlas</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    {healthData?.services?.database?.status || "CONNECTED"}
                  </span>
                </div>

                {/* Storage */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block">Screenshot Vault</span>
                    <span className="font-bold text-white text-sm">Cloudinary Storage</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    {healthData?.services?.storage?.status || "CONNECTED"}
                  </span>
                </div>

                {/* Authentication */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block">Session Guard</span>
                    <span className="font-bold text-white text-sm">JWT & Bcrypt</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    ONLINE
                  </span>
                </div>

                {/* Server */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block">API Engine</span>
                    <span className="font-bold text-white text-sm">Express TypeScript</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    ONLINE
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ===================================================================== */}
      {/* MODAL: PAYMENT SCREENSHOT LIGHTBOX WITH ZOOM */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {screenshotModalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
            <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
              <button
                onClick={() => setScreenshotZoom((prev) => Math.min(prev + 0.25, 3))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setScreenshotZoom((prev) => Math.max(prev - 0.25, 0.5))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setScreenshotModalUrl(null)}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center overflow-auto p-4">
              <div
                style={{ transform: `scale(${screenshotZoom})` }}
                className="transition-transform duration-200"
              >
                <img
                  src={screenshotModalUrl}
                  alt="Payment Screenshot Full Proof"
                  className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/20"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL: REJECT PAYMENT REASON */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {rejectModalTeamId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md p-6 rounded-3xl bg-[#0e0714] border border-red-500/40 font-mono space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-red-300 uppercase">REJECT PAYMENT PROOF</h3>
              <p className="text-xs text-gray-400">
                Provide a specific reason for rejection. The participant will see this notice.
              </p>

              <textarea
                rows={3}
                placeholder="e.g. Invalid 12-digit UTR, payment amount mismatch, or illegible screenshot."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-black border border-white/15 text-white text-xs focus:outline-none focus:border-red-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectModalTeamId(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerifyPayment(rejectModalTeamId, "REJECT", rejectionReasonInput)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL: TEAM DETAILS VIEW */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#0a0f1d] border border-white/20 font-mono space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-bold text-rose-400 block">{selectedTeam.teamId}</span>
                  <h3 className="text-xl font-bold text-white">{selectedTeam.teamName}</h3>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Members */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Team Participants (4/4)</h4>
                <div className="space-y-2">
                  {selectedTeam.members?.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">{idx + 1}. {m.name}</span>
                        <span className="text-[11px] text-gray-400">{m.registrationNumber} • {m.generatedCollegeEmail}</span>
                      </div>
                      <div className="text-right text-[11px] text-gray-300">
                        <span>{m.department} - {m.year}</span>
                        <span className="block text-gray-500">{m.mobile}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              {selectedTeam.payment && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">UTR:</span>
                    <span className="text-white font-bold">{selectedTeam.payment.utr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-emerald-400 font-bold">{selectedTeam.payment.paymentStatus}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Link
                  href={`/pass/${selectedTeam.teamId}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Open Event Pass</span>
                </Link>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL: EDIT TEAM DETAILS */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {editingTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#0a0f1d] border border-white/20 font-mono space-y-4 shadow-2xl text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white uppercase">EDIT TEAM: {editingTeam.teamId}</h3>
                <button onClick={() => setEditingTeam(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">TEAM NAME (BLOCK LETTERS)</label>
                <input
                  type="text"
                  value={editingTeam.teamName}
                  onChange={(e) => setEditingTeam({ ...editingTeam, teamName: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white uppercase font-bold tracking-wider focus:border-rose-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">PAYMENT STATUS</label>
                <select
                  value={editingTeam.paymentStatus}
                  onChange={(e) => setEditingTeam({ ...editingTeam, paymentStatus: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTeamEdit}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL: CREATE NEW ADMIN */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {newAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <form
              onSubmit={handleCreateAdmin}
              className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0e0714] border border-rose-500/40 font-mono space-y-4 shadow-2xl text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white uppercase">CREATE ADMIN ACCOUNT</h3>
                <button
                  type="button"
                  onClick={() => setNewAdminModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                  placeholder="e.g. Lead Coordinator"
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">ADMIN USERNAME *</label>
                <input
                  type="text"
                  required
                  value={newAdminData.username}
                  onChange={(e) => setNewAdminData({ ...newAdminData, username: e.target.value })}
                  placeholder="e.g. dinesh_admin"
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">PASSWORD *</label>
                <input
                  type="password"
                  required
                  value={newAdminData.password}
                  onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">ASSIGNED ROLE</label>
                <select
                  value={newAdminData.role}
                  onChange={(e) => setNewAdminData({ ...newAdminData, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white"
                >
                  <option value="ADMIN">ADMIN (Registrations + Teams + Payments)</option>
                  <option value="VERIFIER">VERIFIER (Payment & QR Verification)</option>
                  <option value="VIEWER">VIEWER (Read-Only Access)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setNewAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL: CREATE NEW RULE */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {newRuleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <form
              onSubmit={handleCreateRule}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#0e0714] border border-rose-500/40 font-mono space-y-4 shadow-2xl text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white uppercase">CREATE NEW PARTICIPATION RULE</h3>
                <button
                  type="button"
                  onClick={() => setNewRuleModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">BADGE (e.g. RULE 1)</label>
                  <input
                    type="text"
                    value={newRuleData.badge}
                    onChange={(e) => setNewRuleData({ ...newRuleData, badge: e.target.value })}
                    placeholder={`RULE ${rulesList.length + 1}`}
                    className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-bold">ACCENT COLOR</label>
                  <select
                    value={newRuleData.accentColor}
                    onChange={(e) => setNewRuleData({ ...newRuleData, accentColor: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                  >
                    <option value="rose">Rose / Crimson</option>
                    <option value="cyan">Cyan / Neon Blue</option>
                    <option value="amber">Amber / Orange</option>
                    <option value="emerald">Emerald / Green</option>
                    <option value="purple">Purple / Violet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">RULE TITLE *</label>
                <input
                  type="text"
                  required
                  value={newRuleData.title}
                  onChange={(e) => setNewRuleData({ ...newRuleData, title: e.target.value })}
                  placeholder="e.g. REGISTRATION FEE"
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white font-sans font-bold"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">HIGHLIGHT TEXT (OPTIONAL)</label>
                <input
                  type="text"
                  value={newRuleData.highlight}
                  onChange={(e) => setNewRuleData({ ...newRuleData, highlight: e.target.value })}
                  placeholder="e.g. ₹350 per participant"
                  className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">DESCRIPTION *</label>
                <textarea
                  rows={3}
                  required
                  value={newRuleData.description}
                  onChange={(e) => setNewRuleData({ ...newRuleData, description: e.target.value })}
                  placeholder="Full description of the rule..."
                  className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white font-sans"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">BULLET POINTS (ONE PER LINE)</label>
                <textarea
                  rows={3}
                  value={newRuleData.points}
                  onChange={(e) => setNewRuleData({ ...newRuleData, points: e.target.value })}
                  placeholder="Point 1&#10;Point 2&#10;Point 3"
                  className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">ICON</label>
                  <select
                    value={newRuleData.iconName}
                    onChange={(e) => setNewRuleData({ ...newRuleData, iconName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                  >
                    <option value="ShieldCheck">Shield / Security</option>
                    <option value="CreditCard">Credit Card / Fee</option>
                    <option value="Users">Users / Team</option>
                    <option value="FileText">File / Details</option>
                    <option value="Calendar">Calendar / Venue</option>
                    <option value="Award">Award / Credits</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="newRuleEnabled"
                    checked={newRuleData.isEnabled}
                    onChange={(e) => setNewRuleData({ ...newRuleData, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="newRuleEnabled" className="text-gray-300 font-bold cursor-pointer">
                    Enable Rule
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setNewRuleModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg cursor-pointer"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL: EDIT RULE */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {editingRule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <form
              onSubmit={handleSaveRuleEdit}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#0e0714] border border-rose-500/40 font-mono space-y-4 shadow-2xl text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white uppercase">EDIT RULE: {editingRule.badge || editingRule.title}</h3>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">BADGE</label>
                  <input
                    type="text"
                    value={editingRule.badge || ""}
                    onChange={(e) => setEditingRule({ ...editingRule, badge: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-bold">ACCENT COLOR</label>
                  <select
                    value={editingRule.accentColor || "rose"}
                    onChange={(e) => setEditingRule({ ...editingRule, accentColor: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                  >
                    <option value="rose">Rose / Crimson</option>
                    <option value="cyan">Cyan / Neon Blue</option>
                    <option value="amber">Amber / Orange</option>
                    <option value="emerald">Emerald / Green</option>
                    <option value="purple">Purple / Violet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">RULE TITLE *</label>
                <input
                  type="text"
                  required
                  value={editingRule.title}
                  onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white font-sans font-bold"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">HIGHLIGHT TEXT</label>
                <input
                  type="text"
                  value={editingRule.highlight || ""}
                  onChange={(e) => setEditingRule({ ...editingRule, highlight: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">DESCRIPTION *</label>
                <textarea
                  rows={3}
                  required
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white font-sans"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">BULLET POINTS (ONE PER LINE)</label>
                <textarea
                  rows={3}
                  value={editingRule.points}
                  onChange={(e) => setEditingRule({ ...editingRule, points: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">ICON</label>
                  <select
                    value={editingRule.iconName || "ShieldCheck"}
                    onChange={(e) => setEditingRule({ ...editingRule, iconName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-black border border-white/15 text-white"
                  >
                    <option value="ShieldCheck">Shield / Security</option>
                    <option value="CreditCard">Credit Card / Fee</option>
                    <option value="Users">Users / Team</option>
                    <option value="FileText">File / Details</option>
                    <option value="Calendar">Calendar / Venue</option>
                    <option value="Award">Award / Credits</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="editRuleEnabled"
                    checked={editingRule.isEnabled}
                    onChange={(e) => setEditingRule({ ...editingRule, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="editRuleEnabled" className="text-gray-300 font-bold cursor-pointer">
                    Enable Rule
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Change Admin Password Modal */}
        {changePasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0b0512] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(225,29,72,0.3)] relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Change Admin Password
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setChangePasswordModal(false);
                    setChangePassError(null);
                    setCurrentPasswordInput("");
                    setNewPasswordInput("");
                    setConfirmPasswordInput("");
                  }}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {changePassError && (
                <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{changePassError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">CURRENT PASSWORD *</label>
                  <input
                    type="password"
                    required
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-rose-500/60 focus:outline-none text-white transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-bold">NEW PASSWORD * (MIN 8 CHARS)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-rose-500/60 focus:outline-none text-white transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-bold">CONFIRM NEW PASSWORD *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-rose-500/60 focus:outline-none text-white transition-all font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setChangePasswordModal(false);
                      setChangePassError(null);
                      setCurrentPasswordInput("");
                      setNewPasswordInput("");
                      setConfirmPasswordInput("");
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold cursor-pointer hover:bg-white/15"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changePassLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {changePassLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
