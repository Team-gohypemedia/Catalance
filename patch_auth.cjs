const fs = require('fs');

let data = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add import
if (!data.includes('import PublicRoute from "@/components/features/auth/PublicRoute";')) {
  data = data.replace(
    'import ProtectedRoute from "@/components/features/auth/ProtectedRoute";',
    'import ProtectedRoute from "@/components/features/auth/ProtectedRoute";\nimport PublicRoute from "@/components/features/auth/PublicRoute";'
  );
}

// 2. Replace components with PublicRoute wrapper
data = data.replace(
  /<Route\s+path="\/login"\s+element=\{\s*<LayoutWithNavbar>\s*<LoginPage \/>\s*<\/LayoutWithNavbar>\s*\}\s*\/>/g,
  '<Route path="/login" element={<PublicRoute><LayoutWithNavbar><LoginPage /></LayoutWithNavbar></PublicRoute>} />'
);

data = data.replace(
  /<Route\s+path="\/forgot-password"\s+element=\{\s*<LayoutWithNavbar>\s*<ForgotPasswordPage \/>\s*<\/LayoutWithNavbar>\s*\}\s*\/>/g,
  '<Route path="/forgot-password" element={<PublicRoute><LayoutWithNavbar><ForgotPasswordPage /></LayoutWithNavbar></PublicRoute>} />'
);

data = data.replace(
  /<Route\s+path="\/reset-password"\s+element=\{\s*<LayoutWithNavbar>\s*<ResetPasswordPage \/>\s*<\/LayoutWithNavbar>\s*\}\s*\/>/g,
  '<Route path="/reset-password" element={<PublicRoute><LayoutWithNavbar><ResetPasswordPage /></LayoutWithNavbar></PublicRoute>} />'
);

data = data.replace(
  '<Route path="/project-manager/login" element={<PMLogin />} />',
  '<Route path="/project-manager/login" element={<PublicRoute><PMLogin /></PublicRoute>} />'
);

data = data.replace(
  '<Route path="/admin/login" element={<AdminLogin />} />',
  '<Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />'
);

fs.writeFileSync('src/App.jsx', data);
console.log('Patched App.jsx');
