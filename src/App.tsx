import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { HomePage } from "./components/HomePage";
import { PropertyDetail } from "./components/PropertyDetail";
import { BookingFlow } from "./components/BookingFlow";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { useState, useEffect } from "react";

type Page = 
  | { type: "home" }
  | { type: "property"; id: string }
  | { type: "booking"; propertyId: string }
  | { type: "dashboard" }
  | { type: "admin" };

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>({ type: "home" });
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userProfile = useQuery(api.users.getUserProfile);
  const createProfile = useMutation(api.users.createUserProfile);

  // Auto-create user profile when user logs in
  useEffect(() => {
    if (loggedInUser && !userProfile) {
      createProfile();
    }
  }, [loggedInUser, userProfile, createProfile]);

  const navigate = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => navigate({ type: "home" })}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">1B</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent">
                1bhk.life
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => navigate({ type: "home" })}
                className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
              >
                Explore
              </button>
              <Authenticated>
                <button 
                  onClick={() => navigate({ type: "dashboard" })}
                  className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
                >
                  My Trips
                </button>
                <button 
                  onClick={() => navigate({ type: "admin" })}
                  className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
                >
                  Host Dashboard
                </button>
              </Authenticated>
            </nav>

            <div className="flex items-center space-x-4">
              <Authenticated>
                <div className="flex items-center space-x-3">
                  {userProfile && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      userProfile.loyaltyTier === "Elite" ? "bg-yellow-100 text-yellow-800" :
                      userProfile.loyaltyTier === "Emerald" ? "bg-emerald-100 text-emerald-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {userProfile.loyaltyTier} • {userProfile.loyaltyPoints} pts
                    </div>
                  )}
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {loggedInUser?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <SignOutButton />
                </div>
              </Authenticated>
              <Unauthenticated>
                <button className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-2 rounded-full font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg">
                  Sign In
                </button>
              </Unauthenticated>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Content currentPage={currentPage} navigate={navigate} />
      </main>
      
      <Toaster />
    </div>
  );
}

function Content({ currentPage, navigate }: { 
  currentPage: Page; 
  navigate: (page: Page) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-20 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-emerald-900 mb-2">Welcome to 1bhk.life</h2>
              <p className="text-emerald-600">Discover luxury stays, perfectly synced</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {currentPage.type === "home" && <HomePage navigate={navigate} />}
        {currentPage.type === "property" && (
          <PropertyDetail propertyId={currentPage.id} navigate={navigate} />
        )}
        {currentPage.type === "booking" && (
          <BookingFlow propertyId={currentPage.propertyId} navigate={navigate} />
        )}
        {currentPage.type === "dashboard" && <UserDashboard navigate={navigate} />}
        {currentPage.type === "admin" && <AdminDashboard navigate={navigate} />}
      </Authenticated>
    </>
  );
}
