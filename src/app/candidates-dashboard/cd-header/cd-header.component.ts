import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ApplicationRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { ProfileUpdateService } from '../../services/profile-update.service';
import { PusherService } from '../../services/pusher.service';
import { JwtTokenUtil } from '../../utils/jwt-token.util';
import { Subscription } from 'rxjs';

interface SearchResult {
    id: number;
    nom: string;
    email: string;
    role: string | null;
}

@Component({
    selector: 'app-cd-header',
    standalone: false,
    templateUrl: './cd-header.component.html',
    styleUrls: ['./cd-header.component.scss']
})
export class CdHeaderComponent implements OnInit, OnDestroy {

    @ViewChild('notificationList') notificationList?: ElementRef;

    searchTerm = '';
    searchResults: SearchResult[] = [];
    showSearchResults = false;
    isSearching = false;
    unreadNotifications = 0;
    currentUserName = 'User';
    currentUserEmail = '';
    currentUserInitial = 'U';
    currentUserImageUrl = '';
    activeDropdown: string | null = null;
    followedUsers: Set<number> = new Set();
    followingUsers: Set<number> = new Set();
    currentUserId: number | null = null;
    
    // Notification panel properties
    showNotificationPanel = false;
    notifications: any[] = [];
    
    private searchDebounce?: number;
    private notificationSubscription?: Subscription;

    constructor(
        private apiService: ApiService,
        private router: Router,
        private profileUpdateService: ProfileUpdateService,
        private pusherService: PusherService,
        private changeDetectorRef: ChangeDetectorRef,
        private appRef: ApplicationRef,
        private ngZone: NgZone
    ) { }

    ngOnInit() {
        this.currentUserEmail = this.resolveCurrentUserEmail();
        this.currentUserInitial = this.buildInitial(this.currentUserEmail);
        this.currentUserName = String(localStorage.getItem('userName') || this.currentUserName);
        this.loadHeaderProfileData();

        // Get token and extract user ID from JWT
        const token = localStorage.getItem('token');
        
        console.log('🔐 Token available:', !!token);

        if (token) {
            // Extract user ID from JWT token
            this.currentUserId = JwtTokenUtil.extractUserIdFromToken(token);
            console.log('👤 Current user ID extracted from token:', this.currentUserId);
            
            if (this.currentUserId) {
                // Subscribe to Pusher notifications
                console.log('📡 Subscribing to Pusher notifications...');
                this.pusherService.subscribeToNotifications(this.currentUserId);

                // Listen for incoming notifications in real-time
                this.notificationSubscription = this.pusherService.getNotificationStream().subscribe((notification) => {
                    if (notification) {
                        console.log('📬 NEW NOTIFICATION RECEIVED IN REAL-TIME:', notification);
                        console.log('🔍 Current unreadNotifications before update:', this.unreadNotifications);
                        
                        // Update in angular zone to ensure proper change detection
                        this.ngZone.run(() => {
                            // Add notification to the beginning of the list
                            this.notifications.unshift({
                                id: notification.id,
                                type: notification.type,
                                message: notification.message,
                                senderId: notification.senderId,
                                createdAt: notification.createdAt,
                                isRead: false
                            });
                            
                            // Increment unread count - explicitly reassign to trigger bindings
                            this.unreadNotifications = this.unreadNotifications + 1;
                            console.log('🔔 Unread count updated to:', this.unreadNotifications);
                            console.log('📬 Notifications in panel:', this.notifications.length);
                            
                            // Mark for check and force detection
                            this.changeDetectorRef.markForCheck();
                            this.changeDetectorRef.detectChanges();
                            
                            // Scroll to top if panel is open to show newest notification
                            this.scrollNotificationListToTop();
                        });
                    }
                });

                // Load initial unread notification count
                this.loadUnreadNotificationCount();
            } else {
                console.error('❌ Could not extract user ID from token');
            }
        } else {
            console.warn('⚠️ No token found. Cannot subscribe to notifications.');
        }

        // Listen for profile picture updates
        this.profileUpdateService.profilePictureUpdated$.subscribe((newImageUrl: string) => {
            this.currentUserImageUrl = newImageUrl;
            console.log('✅ Profile picture updated in header:', newImageUrl);
        });
    }

    ngOnDestroy() {
        // Unsubscribe from Pusher when component is destroyed
        if (this.currentUserId) {
            this.pusherService.unsubscribeFromNotifications(this.currentUserId);
        }
        if (this.notificationSubscription) {
            this.notificationSubscription.unsubscribe();
        }
    }

    onSearchChange() {
        if (this.searchDebounce) {
            window.clearTimeout(this.searchDebounce);
        }

        const term = this.searchTerm.trim();
        if (!term) {
            this.resetSearch();
            return;
        }

        this.searchDebounce = window.setTimeout(() => {
            this.executeSearch(term);
        }, 250);
    }

    executeSearch(term: string) {
        this.isSearching = true;
        this.showSearchResults = true;
        const token = localStorage.getItem('token');
        console.log('🔍 Search initiated for:', term);
        console.log('📋 Token available:', !!token);

        this.apiService.getUsersByName(term).subscribe({
            next: (results) => {
                console.log('✅ Search results:', results);
                const normalizedEmail = this.currentUserEmail.toLowerCase();
                this.searchResults = results.filter((user: SearchResult) =>
                    user.email?.toLowerCase() !== normalizedEmail
                );
                
                // Check follow status for each result
                this.searchResults.forEach(user => {
                    this.checkFollowStatus(user.id, token);
                });
                
                this.isSearching = false;
                this.showSearchResults = true;
            },
            error: (error) => {
                console.error('❌ Search error:', error);
                this.searchResults = [];
                this.isSearching = false;
                this.showSearchResults = true;
            }
        });
    }

    checkFollowStatus(userId: number, token: string | null) {
        if (!token) {
            return;
        }

        this.apiService.isFollowing(userId, token).subscribe({
            next: (response) => {
                if (response.isFollowing) {
                    this.followedUsers.add(userId);
                    this.followingUsers.add(userId);
                    console.log('✅ User', userId, 'is already followed');
                }
            },
            error: (error) => {
                console.error('❌ Error checking follow status for user', userId, ':', error);
            }
        });
    }

    selectUser(user: SearchResult) {
        this.searchTerm = user.nom;
        this.showSearchResults = false;
    }

    followUser(user: SearchResult) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No token found. User not authenticated.');
            return;
        }

        // If already followed, unfollow instead
        if (this.isUserFollowed(user.id)) {
            console.log('👥 Unfollowing user:', user.nom, 'ID:', user.id);
            this.apiService.unfollowUser(user.id, token).subscribe({
                next: (response) => {
                    console.log('✅ Successfully unfollowed user:', response);
                    this.followedUsers.delete(user.id);
                    this.followingUsers.delete(user.id);
                },
                error: (error) => {
                    console.error('❌ Error unfollowing user:', error);
                }
            });
        } else {
            // Follow the user
            console.log('👥 Following user:', user.nom, 'ID:', user.id);
            this.apiService.followUser(user.id, token).subscribe({
                next: (response) => {
                    console.log('✅ Successfully followed user:', response);
                    this.followedUsers.add(user.id);
                    this.followingUsers.add(user.id);
                },
                error: (error) => {
                    console.error('❌ Error following user:', error);
                }
            });
        }
    }

    isUserFollowed(userId: number): boolean {
        return this.followedUsers.has(userId) || this.followingUsers.has(userId);
    }

    onSearchBlur() {
        setTimeout(() => this.showSearchResults = false, 200);
    }

    clearSearch() {
        this.searchTerm = '';
        this.resetSearch();
    }

    toggleNotification() {
        this.unreadNotifications = 0;
    }

    toggleDropdown(menu: string) {
        this.activeDropdown = this.activeDropdown === menu ? null : menu;
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('candidatId');
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
    }

    private resetSearch() {
        this.searchResults = [];
        this.showSearchResults = false;
        this.isSearching = false;
    }

    private resolveCurrentUserEmail(): string {
        return String(localStorage.getItem('userEmail') || '').trim().toLowerCase();
    }

    private loadHeaderProfileData(): void {
        const email = this.currentUserEmail;
        if (!email) {
            return;
        }

        this.apiService.getCandidateByEmail(email).subscribe({
            next: (data: any) => {
                if (data) {
                    this.currentUserImageUrl = data.profile_picture_url || data.profilePictureUrl || '';
                    this.currentUserName = data.nom || this.currentUserName;
                }
            },
            error: () => {
                // keep fallback values if candidate info is unavailable
            }
        });
    }

    get displayProfilePictureUrl(): string {
        return this.currentUserImageUrl || '/images/candidates/candidate1.jpg';
    }

    private buildInitial(email: string): string {
        return email ? email.charAt(0).toUpperCase() : 'U';
    }

    private loadUnreadNotificationCount(): void {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        this.apiService.getUnreadNotificationCount(token).subscribe({
            next: (response: any) => {
                this.unreadNotifications = response.unreadCount || 0;
                console.log('📊 Unread notifications:', this.unreadNotifications);
                
                // Trigger global change detection
                this.appRef.tick();
            },
            error: (error) => {
                console.error('❌ Error loading unread notification count:', error);
            }
        });
    }

    // ==================== NOTIFICATION PANEL METHODS ====================

    toggleNotificationPanel(): void {
        this.showNotificationPanel = !this.showNotificationPanel;
        
        if (this.showNotificationPanel) {
            console.log('📬 Opening notification panel...');
            this.loadNotifications();
        }
    }

    loadNotifications(): void {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No token found');
            return;
        }

        this.apiService.getNotifications(token).subscribe({
            next: (notifications: any[]) => {
                this.notifications = notifications || [];
                console.log('📬 Notifications loaded:', this.notifications.length);
            },
            error: (error) => {
                console.error('❌ Error loading notifications:', error);
                this.notifications = [];
            }
        });
    }

    markNotificationAsRead(notificationId: number): void {
        if (!notificationId) return;

        this.apiService.markNotificationAsRead(notificationId).subscribe({
            next: (response: any) => {
                console.log('✅ Notification marked as read:', notificationId);
                
                // Update the notification in the list
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.isRead = true;
                    this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
                    
                    // Trigger global change detection for badge update
                    this.appRef.tick();
                }
            },
            error: (error) => {
                console.error('❌ Error marking notification as read:', error);
            }
        });
    }

    markAllAsRead(): void {
        const token = localStorage.getItem('token');
        if (!token) return;

        this.apiService.markAllNotificationsAsRead(token).subscribe({
            next: (response: any) => {
                console.log('✅ All notifications marked as read');
                
                // Update all notifications
                this.notifications.forEach(n => n.isRead = true);
                this.unreadNotifications = 0;
                
                // Trigger global change detection for badge update
                this.appRef.tick();
            },
            error: (error) => {
                console.error('❌ Error marking all notifications as read:', error);
            }
        });
    }

    deleteAllNotifications(): void {
        const token = localStorage.getItem('token');
        if (!token) return;

        this.apiService.deleteAllNotifications(token).subscribe({
            next: (response: any) => {
                console.log('✅ All notifications deleted');
                
                // Clear the notifications list
                this.notifications = [];
                this.unreadNotifications = 0;
                console.log('📬 Notification list cleared');
                
                // Trigger global change detection
                this.appRef.tick();
            },
            error: (error) => {
                console.error('❌ Error deleting all notifications:', error);
            }
        });
    }

    formatDate(dateString: string): string {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) {
                return 'just now';
            } else if (diffMins < 60) {
                return `${diffMins}m ago`;
            } else if (diffHours < 24) {
                return `${diffHours}h ago`;
            } else if (diffDays < 7) {
                return `${diffDays}d ago`;
            } else {
                // Format as date
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        } catch (error) {
            return 'recently';
        }
    }

    private scrollNotificationListToTop(): void {
        // Use setTimeout to allow DOM to update first
        setTimeout(() => {
            if (this.notificationList && this.notificationList.nativeElement) {
                this.notificationList.nativeElement.scrollTop = 0;
                console.log('⬆️ Scrolled notification list to top');
            }
        }, 0);
    }

    // ==================== DELETE ACCOUNT METHODS ====================

    openDeleteAccountModal(): void {
        // Show confirmation alert instead of modal
        const confirmed = window.confirm(
            'Are you sure you want to DELETE YOUR ACCOUNT?\n\n' +
            'This will:\n' +
            '• Remove your profile permanently\n' +
            '• Delete all your personal information\n' +
            '• Remove your location data\n' +
            '• This action CANNOT be undone\n\n' +
            'You will be logged out immediately.\n\n' +
            'Click OK to confirm deletion or Cancel to go back.'
        );

        if (confirmed) {
            this.deleteAccount();
        }
    }

    private deleteAccount(): void {
        const token = localStorage.getItem('token');
        const userId = this.currentUserId;

        if (!token || !userId) {
            console.error('❌ Missing token or user ID');
            alert('Error: Cannot delete account. Please log in again.');
            return;
        }

        console.log('🗑️ Deleting account for user ID:', userId);

        this.apiService.deleteAccount(userId, token).subscribe({
            next: (response: any) => {
                console.log('✅ Account deleted successfully:', response);
                
                // Clear localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('candidatId');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                
                // Show success message
                alert('✅ Your account has been deleted successfully.\n\nYou will be redirected to the login page.');
                
                // Redirect to login
                this.router.navigate(['/login']);
            },
            error: (error: any) => {
                console.error('❌ Error deleting account:', error);
                
                const errorMessage = error?.error?.message || 'Failed to delete account. Please try again.';
                alert('❌ Error: ' + errorMessage);
            }
        });
    }



    confirmDeleteAccount(): void {
        // This method is no longer used with alert-based confirmation
    }
}
