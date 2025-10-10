# 📚 User Guide: Dual Submission Interface

## How to Submit a Complaint - Two Easy Ways!

---

## Method 1: 📝 Text Complaint (Manual Form)

**Best for:** When you want to type out your complaint details manually

### Steps:

1. **Select Text Complaint Mode**
   - Click on "📝 Text Complaint" tab at the top
   - The tab will turn blue to show it's active

2. **Fill Out the Form**
   - **Title:** Brief summary of your issue (e.g., "Broken streetlight on Main St")
   - **Category:** Choose from dropdown (Infrastructure, Utilities, etc.)
   - **Description:** Detailed explanation of the problem
   - **Location:** Where the issue is located
   - **Contact Info:** Your phone and email
   - **Urgency:** Select Low, Medium, or High

3. **Watch AI Analysis**
   - As you type, AI analyzes your complaint
   - Wait 1.5 seconds after stopping typing
   - See similar complaints appear
   - Get automatic category and department suggestions

4. **Add Attachments (Optional)**
   - Upload photos or documents for additional proof
   - Multiple files supported
   - These will be processed through RAG pipeline

5. **Submit**
   - Click "Submit Complaint" button
   - Wait for AI processing (you'll see a loading animation)

6. **View Success Summary**
   - Your complaint ID
   - Assigned department
   - Estimated resolution time
   - AI analysis results

---

## Method 2: 📄 Document Upload (Automatic Extraction)

**Best for:** When you have a written complaint in a document or image

### Steps:

1. **Select Document Upload Mode**
   - Click on "📄 Document Upload" tab at the top
   - The tab will turn blue to show it's active

2. **Upload Your Document**
   - **Drag & Drop:** Drag your file into the upload zone
   - **OR Click:** Click "Select Document" to browse files
   - **Supported formats:** PDF, DOCX, PNG, JPG
   - **Max size:** 10MB

3. **Wait for AI Extraction**
   - You'll see "Analyzing Document..." message
   - AI extracts all complaint details automatically:
     - Title
     - Category
     - Description
     - Location
     - Urgency level

4. **Review Extracted Data**
   - Check the information AI extracted
   - Make sure everything looks correct
   - You'll see:
     - Title in a card
     - Category with emoji
     - Urgency level (color-coded)
     - Full description
     - Detected location
     - Vector DB ID and Complaint ID

5. **Confirm or Cancel**
   - **Confirm & Submit:** If everything looks good
   - **Cancel & Upload New:** If you want to try a different document

6. **View Success Summary**
   - Same as text mode
   - Complaint already processed!

---

## 🎯 Which Method Should You Use?

### Use Text Complaint When:
- ✅ You want to type out your complaint
- ✅ You prefer manual control over each field
- ✅ You want to see AI suggestions as you type
- ✅ Your complaint is straightforward

### Use Document Upload When:
- ✅ You already have a written complaint
- ✅ You have an image of the issue with text
- ✅ You want AI to extract information automatically
- ✅ You want to save time on typing

---

## 💡 Pro Tips

### For Text Mode:
1. **Write 20+ characters** in description to activate AI analysis
2. **Wait 1.5 seconds** after typing to see AI suggestions
3. **Check similar complaints** before submitting - your issue might already be reported!
4. **Use clear titles** - helps AI categorize better

### For Document Mode:
1. **Use clear documents** - better text clarity = better extraction
2. **Include all details** in your document - location, urgency, problem description
3. **Review before confirming** - AI is smart but not perfect!
4. **Use high-quality images** if uploading photos

---

## 🔍 What Happens After Submission?

Both methods follow the same process after submission:

1. ✅ **Complaint Created** - You get a unique Complaint ID
2. 🤖 **AI Analysis** - System analyzes and categorizes your issue
3. 🏢 **Department Assignment** - Auto-assigned to the right department
4. 📊 **Priority Scoring** - Urgency determines priority (0-100)
5. 🗄️ **Vector DB Storage** - Stored for similarity search
6. 📧 **Email Notification** - You receive confirmation email
7. 📱 **Tracking** - View in "My Complaints" section

---

## 🎨 Visual Indicators

### AI Analysis Status:
- 🧠 **Brain Icon** - AI is analyzing
- ⚡ **Sparkles Icon** - AI suggestions available
- 🔄 **Spinner** - Processing in progress

### Urgency Colors:
- 🔴 **Red** - High urgency
- 🟠 **Orange** - Medium urgency  
- 🟢 **Green** - Low urgency

### Department Badges:
- Different colors for each department
- Shows assigned department clearly

---

## ❓ FAQs

**Q: Can I switch modes after starting?**
A: Yes! Click the other tab to switch. Your data will be cleared when switching.

**Q: What if AI extraction is wrong?**
A: In document mode, you can cancel and use text mode instead for manual entry.

**Q: Can I upload multiple files in text mode?**
A: Yes! But they'll be processed separately. Use document mode for automatic extraction from one file.

**Q: How long does AI analysis take?**
A: Text analysis: 1-2 seconds | Document extraction: 5-10 seconds

**Q: What if my document is in another language?**
A: AI supports multiple languages, but English works best currently.

---

## 🆘 Troubleshooting

**AI analysis not working?**
- Make sure you've typed at least 20 characters
- Wait 1.5 seconds after stopping typing
- Check your internet connection

**Document upload failing?**
- Check file size (max 10MB)
- Verify file format (PDF, DOCX, PNG, JPG only)
- Try a different file
- Use text mode as alternative

**Extraction results look wrong?**
- Cancel and try text mode
- Ensure document text is clear and readable
- Use a higher quality scan/photo

---

**Need Help?** Contact support or check the Help & FAQs section!

**Happy Submitting! 🎉**
