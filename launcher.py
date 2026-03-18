import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
import os
import threading

class TelegramBotLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("Telegram AI Assistant Launcher")
        self.root.geometry("500x300")
        self.root.resizable(False, False)
        
        # Set icon if available
        try:
            self.root.iconbitmap(default="icon.ico")
        except:
            pass
        
        # Create main frame
        main_frame = ttk.Frame(root, padding="20")
        main_frame.grid(row=0, column=0, sticky="news")
        
        # Title
        title_label = ttk.Label(main_frame, text="Telegram AI Assistant Launcher", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # Telegram Bot Token
        ttk.Label(main_frame, text="Telegram Bot Token:", 
                 font=("Arial", 10)).grid(row=1, column=0, sticky=tk.W, pady=5)
        self.telegram_token = tk.StringVar()
        telegram_entry = ttk.Entry(main_frame, textvariable=self.telegram_token, 
                                  width=50, show="*")
        telegram_entry.grid(row=2, column=0, columnspan=2, sticky="we", pady=5)
        ttk.Label(main_frame, text="Get from @BotFather", 
                 font=("Arial", 8), foreground="gray").grid(row=3, column=0, columnspan=2, sticky=tk.W)
        
        # Groq API Key
        ttk.Label(main_frame, text="Groq API Key:", 
                 font=("Arial", 10)).grid(row=4, column=0, sticky=tk.W, pady=(20, 5))
        self.groq_key = tk.StringVar()
        groq_entry = ttk.Entry(main_frame, textvariable=self.groq_key, 
                              width=50, show="*")
        groq_entry.grid(row=5, column=0, columnspan=2, sticky="we", pady=5)
        ttk.Label(main_frame, text="Get from https://console.groq.com", 
                 font=("Arial", 8), foreground="gray").grid(row=6, column=0, columnspan=2, sticky=tk.W)
        
        # Instructions
        instructions = """
Instructions:
1. Get your Telegram Bot Token from @BotFather on Telegram
2. Get your Groq API Key from https://console.groq.com (free)
3. Enter both keys above
4. Click "Start Bot" to launch the application
        """
        ttk.Label(main_frame, text=instructions, justify=tk.LEFT,
                 font=("Arial", 9)).grid(row=7, column=0, columnspan=2, 
                                       sticky=tk.W, pady=(30, 10))
        
        # Start button
        self.start_button = ttk.Button(main_frame, text="Start Bot", 
                                      command=self.start_bot)
        self.start_button.grid(row=8, column=0, columnspan=2, pady=20)
        
        # Status label
        self.status_var = tk.StringVar()
        self.status_var.set("Ready to start")
        status_label = ttk.Label(main_frame, textvariable=self.status_var,
                                font=("Arial", 9), foreground="green")
        status_label.grid(row=9, column=0, columnspan=2, pady=5)
        
        # Configure grid weights
        main_frame.columnconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        
        # Set project directory
        self.project_dir = os.path.dirname(os.path.abspath(__file__))
    
    def start_bot(self):
        telegram_token = self.telegram_token.get().strip()
        groq_key = self.groq_key.get().strip()
        
        if not telegram_token:
            messagebox.showerror("Error", "Please enter your Telegram Bot Token")
            return
            
        if not groq_key:
            messagebox.showerror("Error", "Please enter your Groq API Key")
            return
        
        # Disable button and update status
        self.start_button.config(state="disabled")
        self.status_var.set("Updating .env file...")
        self.root.update()
        
        # Update .env file in a separate thread
        thread = threading.Thread(target=self.update_and_start, 
                                 args=(telegram_token, groq_key))
        thread.daemon = True
        thread.start()
    
    def update_and_start(self, telegram_token, groq_key):
        try:
            # Update .env file
            env_path = os.path.join(self.project_dir, '.env')
            env_content = f"""# Telegram 配置
TELEGRAM_BOT_TOKEN={telegram_token}

# Groq 配置 (免费且快速)
GROQ_API_KEY={groq_key}
GROQ_MODEL=llama-3.3-70b-versatile

# 服务配置
PORT=3001
NODE_ENV=development
"""
            
            with open(env_path, 'w', encoding='utf-8') as f:
                f.write(env_content)
            
            # Update status
            self.root.after(0, lambda: self.status_var.set("Starting bot..."))
            
            # Start npm start in the project directory
            process = subprocess.Popen(
                ['npm', 'start'],
                cwd=self.project_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW  # Hide console window on Windows
            )
            
            # Update status
            self.root.after(0, lambda: self.status_var.set("Bot is running! Check Telegram."))
            
            # Optional: Monitor output (for debugging)
            # We'll just let it run in background
            
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            self.root.after(0, lambda: messagebox.showerror("Error", error_msg))
            self.root.after(0, lambda: self.status_var.set("Error occurred"))
            self.root.after(0, lambda: self.start_button.config(state="normal"))

if __name__ == "__main__":
    root = tk.Tk()
    app = TelegramBotLauncher(root)
    root.mainloop()