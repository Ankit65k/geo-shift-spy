# 🛠️ Troubleshooting Guide - Geo Shift Spy

## 🚀 Quick Fix for Blank Screen Issue

### **Problem**: Blank white screen after clicking "Detect Changes"

### **Solution**: 
1. **Run the startup script**: `start-servers.bat`
2. **Or manually**:
   - Open 2 Command Prompt/PowerShell windows
   - Window 1: `node backend/enhanced_server.js`
   - Window 2: `npm run dev`

### **Verification Steps**:

1. **Check Backend** (http://localhost:3001/health):
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Check Frontend** (http://localhost:8080):
   ```bash
   curl http://localhost:8080 | findstr title
   ```
   Should return: `<title>Satellite Image Change Detector...`

---

## 🔧 Common Issues & Solutions

### **Issue 1**: "Analysis Failed - Failed to fetch"
**Cause**: CORS or connection issue
**Solution**: 
- Restart both servers using `start-servers.bat`
- Check that backend allows your frontend port in CORS settings

### **Issue 2**: Blank/White Screen
**Cause**: Component rendering error with enhanced response format
**Solution**: 
- Updated components now handle both old and new API formats
- Check browser console (F12) for JavaScript errors

### **Issue 3**: Port Already in Use
**Solution**:
```bash
# Kill existing Node processes
taskkill /F /IM node.exe

# Restart servers
start-servers.bat
```

### **Issue 4**: Images Upload But No Response
**Cause**: API endpoint mismatch
**Solution**: 
- Ensure backend is running on port 3001
- Check CORS configuration includes your frontend port

---

## 📊 Server Status Check

### **Quick Status Check**:
```bash
# Backend Health
curl http://localhost:3001/health

# Frontend Check  
curl http://localhost:8080 | findstr title
```

### **Expected Response**:
- **Backend**: `{"status":"healthy","version":"2.0.0"}`
- **Frontend**: Should show HTML title tag

---

## 🌐 Port Information

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:8080 (or 8081 if 8080 is busy)
- **API Endpoint**: http://localhost:3001/compare

---

## 🎯 Testing the Application

1. **Start servers**: Run `start-servers.bat`
2. **Open browser**: Go to http://localhost:8080
3. **Upload images**: Select before and after satellite images
4. **Click "Detect Changes"**: Should show dynamic AI analysis
5. **Expected result**: Rich environmental analysis with multiple sections

---

## 📱 Browser Console Debug

If you see blank screen:

1. **Open browser console** (F12 → Console tab)
2. **Look for errors** like:
   - Network errors
   - JavaScript/React errors
   - CORS errors
3. **Check Network tab** for failed requests

---

## 🔄 Complete Reset

If nothing works:

```bash
# 1. Kill all processes
taskkill /F /IM node.exe

# 2. Clean install dependencies
npm install

# 3. Start fresh
start-servers.bat
```

---

## ✅ Success Indicators

When everything works correctly, you should see:

1. **Upload page** with drag-and-drop areas
2. **After clicking "Detect Changes"**: Loading animation
3. **Results page** with:
   - AI Executive Summary (blue section)
   - Detected Changes (individual change cards) 
   - Environmental analysis
   - Before/After image comparison

---

## 💡 Tips

- **Always start backend first** (it takes longer to initialize)
- **Check both server windows** for error messages
- **Use Chrome/Edge** for best compatibility
- **Clear browser cache** if components look broken

---

**Still having issues?** Check the server console windows for specific error messages!