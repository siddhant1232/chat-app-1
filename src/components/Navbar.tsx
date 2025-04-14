import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Menu } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-base-300 fixed top-0 left-0 right-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold">WhatsWeb</span>
        </Link>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/settings"
            className="btn btn-sm btn-ghost gap-2"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </Link>

          {authUser && (
            <>
              <Link to="/profile" className="btn btn-sm btn-ghost gap-2">
                <User className="size-4" />
                <span className="hidden md:inline">Profile</span>
              </Link>
              <button
                onClick={logout}
                className="btn btn-sm btn-ghost gap-2"
                aria-label="Logout"
              >
                <LogOut className="size-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="sm:hidden btn btn-sm btn-ghost"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-4 border-t border-base-300 bg-base-100">
          <div className="flex flex-col gap-2">
            <Link to="/settings" className="btn btn-sm btn-ghost w-full justify-start gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Link>

            {authUser && (
              <>
                <Link to="/profile" className="btn btn-sm btn-ghost w-full justify-start gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-sm btn-ghost w-full justify-start gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
