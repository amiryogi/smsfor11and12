import { useRef, useState } from "react";
import {
  useCurrentUser,
  useChangePassword,
  useUploadAvatar,
} from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/auth.store";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";

export function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useCurrentUser();
  const { user } = useAuthStore();
  const changePassword = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const userData = profile?.data ?? user;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      return; // 5MB max
    }

    uploadAvatar.mutate(file);
    // Reset input so re-uploading the same file works
    e.target.value = "";
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return;
    }
    if (newPassword.length < 8) {
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <ErrorState message="Failed to load profile" onRetry={() => refetch()} />
    );

  const initials = `${userData?.firstName?.charAt(0) ?? ""}${userData?.lastName?.charAt(0) ?? ""}`;

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your account" />

      <div className="mx-auto max-w-2xl space-y-8">
        {/* Avatar & Basic Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Profile Photo
          </h2>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="group relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-2xl font-bold text-primary-600 ring-2 ring-primary-200 transition-all hover:ring-4 hover:ring-primary-300"
              title="Click to upload a new photo"
            >
              {userData?.profilePicS3Key ? (
                <img
                  src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dsjwv44fm"}/image/upload/${userData.profilePicS3Key}`}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div>
              <p className="text-sm text-gray-500">
                Click the avatar to upload a new photo.
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG or GIF. Max 5 MB.
              </p>
              {uploadAvatar.isPending && (
                <p className="mt-1 text-sm text-primary-600">Uploading...</p>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Account Information
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData?.firstName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData?.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{userData?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {userData?.role?.replace(/_/g, " ")}
              </dd>
            </div>
          </dl>
        </div>

        {/* Change Password */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={
                changePassword.isPending ||
                !currentPassword ||
                !newPassword ||
                newPassword !== confirmPassword
              }
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changePassword.isPending ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
