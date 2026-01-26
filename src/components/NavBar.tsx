
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard, User } from "lucide-react";

const NavBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold gradient-text">Malik's Learning Lab</span>
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Subjects</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid grid-cols-1 gap-3 p-4 w-[200px]">
                    <NavigationMenuLink asChild>
                      <Link to="/?subject=math" className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span>Mathematics</span>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/?subject=english" className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>English</span>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to="/?subject=ict" className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>ICT</span>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/student-join">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Join Quiz</Button>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/teacher-dashboard">
                <Button variant="ghost" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link to="/teacher-login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/teacher-signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden space-x-2 flex items-center">
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
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Join</Button>
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
