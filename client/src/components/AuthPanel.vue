<script setup>
import { appStore } from '../stores/appStore';

const store = appStore;
</script>

<!-- ── Auth Panel (shown when not logged in) ────────────── -->
<template>
  <section class="auth-section" v-if="!store.isLoggedIn">
    <div class="auth-card panel-surface">
      <div class="auth-header">
        <div class="auth-logo">NW</div>
        <div>
          <h2 class="auth-title">Nightwave</h2>
          <p class="auth-subtitle">Your personal anime log</p>
        </div>
      </div>

      <!-- Tab switcher -->
      <div class="auth-tabs">
        <button class="auth-tab" :class="{ active: store.authView === 'login' }"    @click="store.switchAuthView('login')">Log In</button>
        <button class="auth-tab" :class="{ active: store.authView === 'register' }" @click="store.switchAuthView('register')">Register</button>
      </div>

      <!-- Error message -->
      <p class="auth-error" v-if="store.authError">{{ store.authError }}</p>

      <!-- Login form -->
      <form v-if="store.authView === 'login'" @submit.prevent="store.handleLogin" class="auth-form">
        <label for="login-email">Email</label>
        <input id="login-email"    v-model.trim="store.loginForm.email"    type="email"    placeholder="you@example.com" required autocomplete="email">
        <label for="login-password">Password</label>
        <input id="login-password" v-model="store.loginForm.password"      type="password" placeholder="••••••••"        required autocomplete="current-password">
        <button class="primary-button" type="submit" :disabled="store.authLoading">
          {{ store.authLoading ? 'Logging in…' : 'Log In' }}
        </button>
        <p class="auth-hint">No account? <a href="#" @click.prevent="store.switchAuthView('register')">Register here</a></p>
      </form>

      <!-- Register form -->
      <form v-if="store.authView === 'register'" @submit.prevent="store.handleRegister" class="auth-form">
        <label for="reg-username">Username</label>
        <input id="reg-username" v-model.trim="store.registerForm.username" type="text"     placeholder="nightwatcher"   required autocomplete="username">
        <label for="reg-email">Email</label>
        <input id="reg-email"    v-model.trim="store.registerForm.email"    type="email"    placeholder="you@example.com" required autocomplete="email">
        <label for="reg-pass">Password <span class="optional-label">(min 6 chars)</span></label>
        <input id="reg-pass"     v-model="store.registerForm.password"      type="password" placeholder="••••••••"        required autocomplete="new-password">
        <label for="reg-confirm">Confirm Password</label>
        <input id="reg-confirm"  v-model="store.registerForm.confirm"       type="password" placeholder="••••••••"        required autocomplete="new-password">
        <button class="primary-button" type="submit" :disabled="store.authLoading">
          {{ store.authLoading ? 'Creating account…' : 'Create Account' }}
        </button>
        <p class="auth-hint">Already have an account? <a href="#" @click.prevent="store.switchAuthView('login')">Log in</a></p>
      </form>
    </div>
  </section>
</template>
