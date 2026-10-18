import React, { useState, useEffect } from "react";
import { UserLocation, Household, ActiveUserSession, AlertData } from "./types";
import { detectRealLocation, discoverNearbyServices } from "./utils/location";
import {
  getActiveUserSession,
  setActiveUserSession,
  getAllHouseholds,
  saveHousehold,
  getStoredActiveAlert,
  setStoredActiveAlert,
  getStoredLanguage,
  setStoredLanguage,
} from "./utils/storage";
import { getDefaultRainfallAlert } from "./utils/calamity";
import { t } from "./utils/languages";
import { LandingPage } from "./components/LandingPage";
import { Header } from "./components/Header";
import { LocationModal } from "./components/LocationModal";
import { AuthModal } from "./components/AuthModal";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { SOSModal } from "./components/SOSModal";
import { ControlRoom } from "./components/ControlRoom";
import { HomeTab } from "./components/tabs/HomeTab";
import { AlertsTab } from "./components/tabs/AlertsTab";
import { GuidesTab } from "./components/tabs/GuidesTab";
import { AskTab } from "./components/tabs/AskTab";
import { ProfileTab } from "./components/tabs/ProfileTab";
import { DEMO_SCENARIOS, DemoScenario } from "./data/demoScenarios";
import { JudgesDemoModal } from "./components/JudgesDemoModal";
import { DemoControllerBanner } from "./components/DemoControllerBanner";
import {
  Home,
  Bell,
  BookOpen,
  MessageSquare,
  User,
} from "lucide-react";

export default function App() {
  // 1. Initial State Setup - Defaults to Hosur to match verified calamity view immediately
  const [location, setLocation] = useState<UserLocation>({
    city: "Hosur",
    state: "Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 12.7409,
    lon: 77.8253,
    displayName: "Hosur, Tamil Nadu, India",
    detectedNativeLanguage: "en",
  });
  const [isLocating, setIsLocating] = useState(true);

  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [activeSession, setActiveSession] = useState<ActiveUserSession | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [hasDismissedAuth, setHasDismissedAuth] = useState(true);
  const [isGuestExploring, setIsGuestExploring] = useState(false);

  // Demo Suite State for Judges
  const [activeDemoScenario, setActiveDemoScenario] = useState<DemoScenario | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Modals & Navigation
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [currentRole, setCurrentRole] = useState<"citizen" | "officials">("citizen");
  const [activeTab, setActiveTab] = useState<"home" | "alerts" | "guides" | "ask" | "profile">("home");
  
  // Active Alert is strictly null unless official severe weather exists or demo is active
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(() => {
    return getStoredActiveAlert();
  });

  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 2. Load Stored Data & Real-time Location on Startup
  useEffect(() => {
    async function initApp() {
      // Check stored language
      const storedLang = getStoredLanguage();
      if (storedLang) setSelectedLang(storedLang);

      // Check stored user session
      const session = getActiveUserSession();
      if (session) {
        const all = getAllHouseholds();
        const found = all.find((h) => h.id === session.householdId);
        if (found) {
          setActiveSession(session);
          setHousehold(found);
          if (found.location) setLocation(found.location);
        }
      }

      // Auto-detect real location (GPS with IP fallback)
      try {
        const realLoc = await detectRealLocation();
        setLocation(realLoc);

        // Check official government bulletins for this detected location
        const query = new URLSearchParams({
          lat: String(realLoc.lat),
          lon: String(realLoc.lon),
          city: realLoc.city || "Current Location",
          state: realLoc.state || "",
          country: realLoc.country || "",
          countryCode: realLoc.countryCode || "",
        });

        const res = await fetch(`/api/weather-alerts?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasEmergency && data.alert) {
            setActiveAlert(data.alert);
            setStoredActiveAlert(data.alert);
          } else {
            // Calm / All-clear weather: do NOT show false emergency
            setActiveAlert(null);
            setStoredActiveAlert(null);
          }
        }

        // If user hasn't manually set a language, map to detected native language
        if (!storedLang && realLoc.detectedNativeLanguage) {
          setSelectedLang(realLoc.detectedNativeLanguage);
          setStoredLanguage(realLoc.detectedNativeLanguage);
        }
      } catch (err) {
        console.warn("Location detection error:", err);
      } finally {
        setIsLocating(false);
      }
    }

    initApp();
  }, []);

  // Language switch handler
  const handleSelectLang = (langCode: string) => {
    setSelectedLang(langCode);
    setStoredLanguage(langCode);
  };

  // Location update handler: searches official updates from govt/weather authorities for the new location
  const handleSelectLocation = async (newLoc: UserLocation) => {
    setLocation(newLoc);

    // If not in a fixed demo scenario, query official updates for the newly selected location!
    if (!activeDemoScenario) {
      try {
        const query = new URLSearchParams({
          lat: String(newLoc.lat),
          lon: String(newLoc.lon),
          city: newLoc.city || "Current Location",
          state: newLoc.state || "",
          country: newLoc.country || "",
          countryCode: newLoc.countryCode || "",
        });

        const res = await fetch(`/api/weather-alerts?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasEmergency && data.alert) {
            setActiveAlert(data.alert);
            setStoredActiveAlert(data.alert);
          } else {
            // New location is normal/all-clear: Clear emergency alert so homepage shows normal weather!
            setActiveAlert(null);
            setStoredActiveAlert(null);
          }
        }
      } catch (err) {
        console.warn("Error querying official alerts for location:", err);
        setActiveAlert(null);
      }
    }

    // If household exists, update its location and nearby services
    if (household) {
      const updatedHousehold: Household = {
        ...household,
        location: newLoc,
        nearbyServices: discoverNearbyServices(newLoc),
        updatedAt: new Date().toISOString(),
      };
      saveHousehold(updatedHousehold);
      setHousehold(updatedHousehold);
    }
  };

  // Launch Demo Scenario for Judges
  const handleLaunchDemoScenario = (scenario: DemoScenario) => {
    setActiveDemoScenario(scenario);
    setLocation(scenario.location);
    setHousehold(scenario.household);
    setActiveAlert(scenario.alert);
    setIsGuestExploring(true);
    setIsDemoModalOpen(false);
    setActiveTab("home");
  };

  // Exit Demo Mode and return to real live monitoring
  const handleExitDemo = async () => {
    setActiveDemoScenario(null);
    try {
      const realLoc = await detectRealLocation();
      setLocation(realLoc);
      const query = new URLSearchParams({
        lat: String(realLoc.lat),
        lon: String(realLoc.lon),
        city: realLoc.city || "Current Location",
        state: realLoc.state || "",
        country: realLoc.country || "",
        countryCode: realLoc.countryCode || "",
      });
      const res = await fetch(`/api/weather-alerts?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasEmergency && data.alert) {
          setActiveAlert(data.alert);
        } else {
          setActiveAlert(null);
        }
      }
    } catch {
      setActiveAlert(null);
    }
  };

  // Quick switch demo scenarios from the top banner
  const handleQuickSwitchDemo = (scenarioId: "critical" | "household" | "severe" | "normal") => {
    const found = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (found) {
      handleLaunchDemoScenario(found);
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    setActiveUserSession(null);
    setActiveSession(null);
    setHousehold(null);
    setIsGuestExploring(false);
    setCurrentRole("citizen");
  };

  // 3. Fallback dummy household for preview if user hasn't onboarded yet but closes auth
  const activeHousehold: Household = household || {
    id: "default-hh",
    primaryPhone: activeSession?.phone || "+1 234 567 8900",
    householdName: "My Family Household",
    address: location.displayName,
    buildingType: "Ground floor",
    totalMembers: 3,
    eldersCount: 1,
    childrenCount: 1,
    bedriddenCount: 0,
    medicalConditions: ["Hypertension"],
    lifeSavingMedicines: ["Blood pressure tablets"],
    powerDependentDevices: ["None"],
    pets: "1 Dog",
    familyMembers: [
      { id: "fm-1", name: "Elder Parent", relationship: "Father", phone: "+1 234 567 8901" },
    ],
    neighbours: [
      { id: "nb-1", name: "Next Door Neighbour", phone: "+1 234 567 8902", houseDetails: "Apt 4B" },
    ],
    location,
    nearbyServices: discoverNearbyServices(location),
    rescueCardShared: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // If user is not authenticated and not exploring as guest, render Landing Page
  if (!activeSession && !isGuestExploring) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white">
        <LandingPage
          location={location}
          selectedLang={selectedLang}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onSelectLang={handleSelectLang}
          onLoginExisting={(hh, session) => {
            setHousehold(hh);
            setActiveSession(session);
            if (hh.location) setLocation(hh.location);
          }}
          onStartOnboarding={(phone) => {
            setOnboardingPhone(phone);
            setIsOnboarding(true);
          }}
          onOfficerLogin={() => {
            setCurrentRole("officials");
            setIsGuestExploring(true);
          }}
          onExploreGuest={() => {
            setIsGuestExploring(true);
          }}
          onOpenDemoSuite={() => setIsDemoModalOpen(true)}
        />

        {/* Judges & Evaluator Interactive Demo Suite Modal */}
        <JudgesDemoModal
          isOpen={isDemoModalOpen}
          onClose={() => setIsDemoModalOpen(false)}
          onSelectScenario={handleLaunchDemoScenario}
        />

        {/* Location Modal */}
        <LocationModal
          currentLocation={location}
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onSelectLocation={handleSelectLocation}
        />

        {/* Onboarding Wizard (Only for first-time registrations) */}
        {isOnboarding && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <OnboardingWizard
              initialPhone={onboardingPhone}
              detectedLocation={location}
              selectedLang={selectedLang}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              onComplete={(hh, session) => {
                setHousehold(hh);
                setActiveSession(session);
                if (hh.location) setLocation(hh.location);
                setIsOnboarding(false);
              }}
              onCancel={() => setIsOnboarding(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* 0. Demo Controller Banner (Only when exploring in Judges Demo Mode) */}
      {activeDemoScenario && (
        <DemoControllerBanner
          currentScenario={activeDemoScenario}
          onOpenScenarioModal={() => setIsDemoModalOpen(true)}
          onExitDemo={handleExitDemo}
          onQuickSwitch={handleQuickSwitchDemo}
        />
      )}

      {/* 1. Top Persistent Header */}
      <Header
        location={location}
        selectedLang={selectedLang}
        onSelectLang={handleSelectLang}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        onOpenSOSModal={() => setIsSOSOpen(true)}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        activeSession={activeSession}
        onSignOut={handleSignOut}
      />

      {/* 2. Main Content Area with bottom navigation buffer */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 pt-3 sm:pt-6 pb-24 sm:pb-28">
        {currentRole === "officials" ? (
          /* Officials' Control Room Dashboard */
          <ControlRoom onBackToCitizen={() => setCurrentRole("citizen")} />
        ) : (
          /* Citizen App Tabs with Smooth Transition */
          <div key={activeTab} className="page-transition">
            {activeTab === "home" && (
              <HomeTab
                location={location}
                household={activeHousehold}
                activeAlert={activeAlert}
                setActiveAlert={setActiveAlert}
                selectedLang={selectedLang}
                onNavigateToTab={(tab) => setActiveTab(tab as any)}
                onOpenSOSModal={() => setIsSOSOpen(true)}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
              />
            )}

            {activeTab === "alerts" && (
              <AlertsTab
                location={location}
                household={activeHousehold}
                activeAlert={activeAlert}
                selectedLang={selectedLang}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
              />
            )}

            {activeTab === "guides" && (
              <GuidesTab selectedLang={selectedLang} />
            )}

            {activeTab === "ask" && (
              <AskTab
                location={location}
                household={activeHousehold}
                activeAlert={activeAlert}
                selectedLang={selectedLang}
              />
            )}

            {activeTab === "profile" && (
              <ProfileTab
                location={location}
                household={activeHousehold}
                setHousehold={setHousehold}
                activeSession={activeSession}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onSignOut={handleSignOut}
                onOpenOfficialsRoom={() => setCurrentRole("officials")}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. Bottom 5-Tab Navigation Bar (Citizen Mode Only) */}
      {currentRole === "citizen" && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto px-2 py-1 flex items-center justify-around">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center gap-1 transition ${
                activeTab === "home"
                  ? "text-red-500 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Home className={`w-5 h-5 transition-transform ${activeTab === "home" ? "scale-110" : ""}`} />
              <span className="text-[10px] sm:text-[11px] truncate max-w-full leading-tight">
                {t("tabHome", selectedLang)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center gap-1 relative transition ${
                activeTab === "alerts"
                  ? "text-red-500 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Bell className={`w-5 h-5 transition-transform ${activeTab === "alerts" ? "scale-110" : ""}`} />
                {activeAlert && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] truncate max-w-full leading-tight">
                {t("tabAlerts", selectedLang)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("guides")}
              className={`flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center gap-1 transition ${
                activeTab === "guides"
                  ? "text-red-500 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className={`w-5 h-5 transition-transform ${activeTab === "guides" ? "scale-110" : ""}`} />
              <span className="text-[10px] sm:text-[11px] truncate max-w-full leading-tight">
                {t("tabGuides", selectedLang)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ask")}
              className={`flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center gap-1 transition ${
                activeTab === "ask"
                  ? "text-red-500 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className={`w-5 h-5 transition-transform ${activeTab === "ask" ? "scale-110" : ""}`} />
              <span className="text-[10px] sm:text-[11px] truncate max-w-full leading-tight">
                {t("tabAsk", selectedLang)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 min-h-[48px] py-1 px-1 flex flex-col items-center justify-center gap-1 transition ${
                activeTab === "profile"
                  ? "text-red-500 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className={`w-5 h-5 transition-transform ${activeTab === "profile" ? "scale-110" : ""}`} />
              <span className="text-[10px] sm:text-[11px] truncate max-w-full leading-tight">
                {t("tabProfile", selectedLang)}
              </span>
            </button>
          </div>
        </nav>
      )}

      {/* 4. Modals */}
      {/* Location Modal */}
      <LocationModal
        currentLocation={location}
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleSelectLocation}
      />

      {/* Two-Option SOS Modal */}
      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        household={activeHousehold}
        activeAlert={activeAlert}
        selectedLang={selectedLang}
      />

      {/* Judges Demo Suite Modal (In-App) */}
      <JudgesDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectScenario={handleLaunchDemoScenario}
      />

      {/* Onboarding Wizard (Only for new registrations) */}
      {isOnboarding && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <OnboardingWizard
            initialPhone={onboardingPhone}
            detectedLocation={location}
            selectedLang={selectedLang}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onComplete={(hh, session) => {
              setHousehold(hh);
              setActiveSession(session);
              setIsOnboarding(false);
            }}
            onCancel={() => setIsOnboarding(false)}
          />
        </div>
      )}

      {/* Auth Modal (shown when requested or first time until dismissed) */}
      {(!activeSession && !hasDismissedAuth) || isAuthModalOpen ? (
        <AuthModal
          location={location}
          selectedLang={selectedLang}
          isOpen={true}
          onClose={() => {
            setHasDismissedAuth(true);
            setIsAuthModalOpen(false);
          }}
          onSuccessExisting={(hh, session) => {
            setHousehold(hh);
            setActiveSession(session);
            setIsAuthModalOpen(false);
            setHasDismissedAuth(true);
          }}
          onNewUser={(phone) => {
            setOnboardingPhone(phone);
            setIsAuthModalOpen(false);
            setHasDismissedAuth(true);
            setIsOnboarding(true);
          }}
          onOfficerLogin={() => {
            setCurrentRole("officials");
            setIsAuthModalOpen(false);
            setHasDismissedAuth(true);
          }}
        />
      ) : null}
    </div>
  );
}
