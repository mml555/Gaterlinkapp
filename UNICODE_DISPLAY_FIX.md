# 🔧 Fixing Unicode Display Issues in Terminal

## 🎯 **Problem**
You're seeing "?" looking boxes in your terminal when running React Native Metro bundler. This is caused by Unicode characters that your terminal font doesn't support.

## ✅ **Solutions**

### **Solution 1: Use Clean Metro Start Script**

I've created a clean start script that reduces Unicode output:

```bash
# Use the clean start script
npm run start:clean
```

### **Solution 2: Update Terminal Font**

1. **For iTerm2:**
   - Go to Preferences → Profiles → Text
   - Change font to "Meslo Nerd Font" or "Fira Code"
   - Enable "Use ligatures"

2. **For Terminal.app:**
   - Go to Preferences → Profiles → Text
   - Change font to "SF Mono" or "Menlo"

3. **For VS Code Terminal:**
   - Open Settings (Cmd+,)
   - Search for "terminal font"
   - Set to "Meslo Nerd Font" or "Fira Code"

### **Solution 3: Set Terminal Environment**

Add these to your `~/.zshrc` file:

```bash
# Add to ~/.zshrc
export TERM=xterm-256color
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
```

Then reload your shell:
```bash
source ~/.zshrc
```

### **Solution 4: Use Alternative Metro Commands**

Instead of `npm start`, try:

```bash
# Option 1: Minimal output
npx react-native start --reset-cache --max-workers=2

# Option 2: No fancy output
TERM=xterm npx react-native start

# Option 3: Use the clean script
./scripts/start-metro-clean.sh
```

## 🎨 **What Those Characters Should Look Like**

The "?" boxes are actually these Unicode characters:
- `▒▓▓▓▒▒` = Metro bundler logo
- `🚀` = Rocket emoji
- `📱` = Phone emoji
- `🔄` = Reload emoji
- `📍` = Location pin emoji

## 🔧 **Quick Fix Commands**

```bash
# 1. Set terminal environment
export TERM=xterm-256color
export LC_ALL=en_US.UTF-8

# 2. Use clean start script
npm run start:clean

# 3. Or start Metro directly with minimal output
npx react-native start --reset-cache --max-workers=2
```

## 📱 **Alternative: Use VS Code Terminal**

If terminal issues persist:

1. Open VS Code
2. Open integrated terminal (Ctrl+`)
3. Run Metro from there (usually has better Unicode support)

## 🎯 **Expected Result**

After applying these fixes:
- ✅ No more "?" boxes in terminal
- ✅ Clean Metro output
- ✅ Proper Unicode character display
- ✅ Better terminal experience

## 🔍 **Troubleshooting**

### **Still Seeing Boxes?**
1. Try a different terminal app (iTerm2, Hyper)
2. Update your terminal font
3. Use the clean start script
4. Check your system's Unicode support

### **Metro Not Starting?**
1. Clear Metro cache: `npx react-native start --reset-cache`
2. Kill existing processes: `pkill -f metro`
3. Restart terminal
4. Try the clean start script

---

## 🎉 **Success!**

Once fixed, your terminal will display clean, readable output without Unicode display issues, making your React Native development experience much smoother!
