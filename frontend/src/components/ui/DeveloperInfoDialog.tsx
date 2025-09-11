import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Linkedin, Instagram, Twitter, GraduationCap, User } from "lucide-react";

interface DeveloperInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeveloperInfoDialog: React.FC<DeveloperInfoDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const developerInfo = {
    name: "Sandeep Pati",
    education: "B-tech Final Year",
    university: "GIET UNIVERSITY",
    photo: "/profile_pic.jpg",
    linkedin: "https://www.linkedin.com/in/sandeep-pati-537ba030b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    instagram: "https://www.instagram.com/sandeep_27.2/",
    twitter: "https://x.com/sandeep_pati18",
  };

  const socialLinks = [
    {
      icon: Linkedin,
      url: developerInfo.linkedin,
      label: "LinkedIn",
      color: "hover:text-blue-500",
    },
    {
      icon: Instagram,
      url: developerInfo.instagram,
      label: "Instagram",
      color: "hover:text-pink-500",
    },
    {
      icon: Twitter,
      url: developerInfo.twitter,
      label: "Twitter",
      color: "hover:text-blue-400",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass glass-hover border-glass-border max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage
                src={developerInfo.photo}
                alt={developerInfo.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
          </div>

          <DialogTitle className="text-2xl font-bold text-neon mb-2 text-center">
            Meet the Developer
          </DialogTitle>

          <DialogDescription className="text-secondary-foreground">
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {developerInfo.name}
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-secondary-foreground">
                  <GraduationCap className="w-4 h-4" />
                  <span>{developerInfo.education}</span>
                </div>
                <p className="text-sm text-secondary-foreground mt-1">
                  {developerInfo.university}
                </p>
              </div>

              <div className="flex justify-center gap-4 mt-6">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-full bg-background-secondary/50 hover:bg-background-secondary transition-colors duration-300 ${link.color}`}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="sr-only">{link.label}</span>
                  </a>
                ))}
              </div>

              <div className="mt-6">
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-primary text-primary-foreground font-semibold py-3 rounded-xl transition-colors duration-300"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperInfoDialog;
