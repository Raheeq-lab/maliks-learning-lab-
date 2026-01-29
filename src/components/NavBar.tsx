import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";
import ThemeToggle from './ThemeToggle';

const NavBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-header border-b border-border py-4 px-6 transition-colors duration-300">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold gradient-text">Malik's Learning Lab</span>
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-white/50 dark:hover:bg-slate-700/50">Subjects</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid grid-cols-1 gap-3 p-4 w-[200px] bg-bg-elevated">
                    <NavigationMenuLink asChild>
                      <Link to="/?subject=math" className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-math-purple"></div>
                        <span className="text-text-primary">Mathematics</span>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/?subject=english" className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-english-green"></div>
                        <span className="text-text-primary">English</span>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/?subject=ict" className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-ict-orange"></div>
                        <span className="text-text-primary">ICT</span>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/student-join">
                  <Button className="bg-focus-blue hover:bg-focus-blue-dark text-white shadow-md">Join Quiz</Button>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="h-6 w-px bg-border mx-2"></div>
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/teacher-dashboard">
                <Button variant="ghost" className="gap-2 text-text-primary hover:bg-white/50 dark:hover:bg-slate-700/50">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" className="gap-2 text-error-coral hover:text-error-coral hover:bg-error-coral-light/20" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link to="/teacher-login">
                <Button variant="outline" className="border-focus-blue text-focus-blue hover:bg-focus-blue-light">Sign In</Button>
              </Link>
              <Link to="/teacher-signup">
                <Button className="bg-focus-blue hover:bg-focus-blue-dark text-white shadow-md">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden space-x-2 flex items-center">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/teacher-dashboard">
                <Button size="sm" variant="ghost">
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/student-join">
                <Button size="sm" className="bg-focus-blue hover:bg-focus-blue-dark text-white">Join</Button>
              </Link>
              <Link to="/teacher-login">
                <Button size="sm" variant="outline">Login</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
