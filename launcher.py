import json
import os
import queue
import subprocess
import sys
import threading
import time
import tkinter as tk
from tkinter import ttk, messagebox

try:
    import winreg  # type: ignore
except Exception:
    winreg = None

class TelegramBotLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("Telegram AI Assistant")
        self.root.geometry("860x620")
        self.root.minsize(820, 560)
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

        self.project_dir = os.path.dirname(os.path.abspath(__file__))
        self.env_path = os.path.join(self.project_dir, ".env")
        self.settings_path = os.path.join(self.project_dir, "launcher_settings.json")

        self.process = None
        self.log_queue: "queue.Queue[str]" = queue.Queue()
        self._stdout_thread = None
        self._log_pump_job = None
        
        # Set icon if available
        try:
            self.root.iconbitmap(default="icon.ico")
        except:
            pass

        self._apply_theme()
        self._build_ui()
        self._load_initial_values()
    
    def _apply_theme(self):
        style = ttk.Style(self.root)
        try:
            style.theme_use("clam")
        except Exception:
            pass

        style.configure("App.TFrame", background="#0b1220")
        style.configure("Card.TFrame", background="#0f1b2d")
        style.configure("Title.TLabel", background="#0b1220", foreground="#e6eefc", font=("Segoe UI", 18, "bold"))
        style.configure("Sub.TLabel", background="#0b1220", foreground="#9fb2d1", font=("Segoe UI", 10))
        style.configure("CardTitle.TLabel", background="#0f1b2d", foreground="#e6eefc", font=("Segoe UI", 11, "bold"))
        style.configure("TLabel", font=("Segoe UI", 10))
        style.configure("TButton", font=("Segoe UI", 10))
        style.map("TButton", relief=[("pressed", "sunken"), ("!pressed", "raised")])
        style.configure("Status.TLabel", background="#0b1220", foreground="#9fe3b2", font=("Segoe UI", 10, "bold"))
        style.configure("Danger.TButton", foreground="#ffffff")
        style.configure("Accent.TButton")

    def _build_ui(self):
        root = self.root
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)

        container = ttk.Frame(root, style="App.TFrame", padding=18)
        container.grid(row=0, column=0, sticky="nsew")
        container.columnconfigure(0, weight=1)
        container.rowconfigure(1, weight=1)

        header = ttk.Frame(container, style="App.TFrame")
        header.grid(row=0, column=0, sticky="ew")
        header.columnconfigure(0, weight=1)

        ttk.Label(header, text="Telegram AI Assistant", style="Title.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(header, text="Launch • Configure • Observe logs", style="Sub.TLabel").grid(row=1, column=0, sticky="w", pady=(2, 10))

        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(header, textvariable=self.status_var, style="Status.TLabel").grid(row=0, column=1, sticky="e")

        self.notebook = ttk.Notebook(container)
        self.notebook.grid(row=1, column=0, sticky="nsew", pady=(8, 0))

        # Tabs
        self.tab_run = ttk.Frame(self.notebook, padding=14)
        self.tab_settings = ttk.Frame(self.notebook, padding=14)
        self.tab_logs = ttk.Frame(self.notebook, padding=14)

        self.notebook.add(self.tab_run, text="Run")
        self.notebook.add(self.tab_settings, text="Settings")
        self.notebook.add(self.tab_logs, text="Logs")

        self._build_run_tab()
        self._build_settings_tab()
        self._build_logs_tab()

    def _build_run_tab(self):
        tab = self.tab_run
        tab.columnconfigure(0, weight=1)
        tab.rowconfigure(2, weight=1)

        card = ttk.Frame(tab, style="Card.TFrame", padding=14)
        card.grid(row=0, column=0, sticky="ew")
        card.columnconfigure(0, weight=1)

        ttk.Label(card, text="Quick Actions", style="CardTitle.TLabel").grid(row=0, column=0, sticky="w")

        actions = ttk.Frame(card, style="Card.TFrame")
        actions.grid(row=1, column=0, sticky="ew", pady=(10, 0))
        for i in range(6):
            actions.columnconfigure(i, weight=1)

        self.btn_start = ttk.Button(actions, text="Start", command=self.start_bot, style="Accent.TButton")
        self.btn_stop = ttk.Button(actions, text="Stop", command=self.stop_bot, state="disabled", style="Danger.TButton")
        self.btn_restart = ttk.Button(actions, text="Restart", command=self.restart_bot, state="disabled")
        self.btn_save = ttk.Button(actions, text="Save Settings", command=self.save_all)
        self.btn_open_logs = ttk.Button(actions, text="Open logs folder", command=self.open_logs_folder)

        self.btn_start.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self.btn_stop.grid(row=0, column=1, sticky="ew", padx=(0, 8))
        self.btn_restart.grid(row=0, column=2, sticky="ew", padx=(0, 8))
        self.btn_save.grid(row=0, column=3, sticky="ew", padx=(0, 8))
        self.btn_open_logs.grid(row=0, column=4, sticky="ew")

        info = ttk.Frame(tab, style="Card.TFrame", padding=14)
        info.grid(row=1, column=0, sticky="ew", pady=(12, 0))
        info.columnconfigure(1, weight=1)

        ttk.Label(info, text="Environment", style="CardTitle.TLabel").grid(row=0, column=0, columnspan=2, sticky="w")
        ttk.Label(info, text="Project").grid(row=1, column=0, sticky="w", pady=(10, 2))
        ttk.Label(info, text=self.project_dir).grid(row=1, column=1, sticky="w", pady=(10, 2))
        ttk.Label(info, text=".env").grid(row=2, column=0, sticky="w", pady=2)
        ttk.Label(info, text=self.env_path).grid(row=2, column=1, sticky="w", pady=2)

        hint = ttk.Frame(tab, style="Card.TFrame", padding=14)
        hint.grid(row=2, column=0, sticky="nsew", pady=(12, 0))
        hint.columnconfigure(0, weight=1)
        hint.rowconfigure(1, weight=1)

        ttk.Label(hint, text="Tip", style="CardTitle.TLabel").grid(row=0, column=0, sticky="w")
        tip_text = (
            "• Configure keys and defaults in Settings\n"
            "• Click Start to run `npm start`\n"
            "• Logs will appear in the Logs tab\n"
            "• If you close the window while running, you'll be asked what to do"
        )
        lbl = ttk.Label(hint, text=tip_text, justify="left")
        lbl.grid(row=1, column=0, sticky="nw")

    def _build_settings_tab(self):
        tab = self.tab_settings
        tab.columnconfigure(0, weight=1)
        tab.rowconfigure(2, weight=1)

        # Keys
        keys = ttk.Frame(tab, style="Card.TFrame", padding=14)
        keys.grid(row=0, column=0, sticky="ew")
        keys.columnconfigure(1, weight=1)

        ttk.Label(keys, text="API Keys", style="CardTitle.TLabel").grid(row=0, column=0, columnspan=2, sticky="w")

        self.var_telegram_token = tk.StringVar()
        self.var_groq_key = tk.StringVar()
        self.var_deepseek_key = tk.StringVar()
        self.var_qwen_key = tk.StringVar()
        self.var_openrouter_key = tk.StringVar()
        self.var_nvidia_key = tk.StringVar()
        self.var_nvidia_base_url = tk.StringVar()
        self.var_nvidia_model = tk.StringVar()

        self._add_labeled_entry(keys, 1, "TELEGRAM_BOT_TOKEN", self.var_telegram_token, secret=True, hint="@BotFather")
        self._add_labeled_entry(keys, 2, "GROQ_API_KEY", self.var_groq_key, secret=True, hint="console.groq.com")
        self._add_labeled_entry(keys, 3, "DEEPSEEK_API_KEY", self.var_deepseek_key, secret=True, hint="platform.deepseek.com")
        self._add_labeled_entry(keys, 4, "QWEN_API_KEY", self.var_qwen_key, secret=True, hint="Aliyun Bailian")
        self._add_labeled_entry(keys, 5, "OPENROUTER_API_KEY", self.var_openrouter_key, secret=True, hint="openrouter.ai")
        self._add_labeled_entry(keys, 6, "NVIDIA_API_KEY", self.var_nvidia_key, secret=True, hint="build.nvidia.com")
        self._add_labeled_entry(keys, 7, "NVIDIA_BASE_URL", self.var_nvidia_base_url, secret=False, hint="default: https://integrate.api.nvidia.com/v1")
        self._add_labeled_entry(keys, 8, "NVIDIA_MODEL", self.var_nvidia_model, secret=False, hint="e.g. z-ai/glm5 | minimaxai/minimax-m2.7")

        # Defaults
        defaults = ttk.Frame(tab, style="Card.TFrame", padding=14)
        defaults.grid(row=1, column=0, sticky="ew", pady=(12, 0))
        for c in range(4):
            defaults.columnconfigure(c, weight=1)

        ttk.Label(defaults, text="Defaults", style="CardTitle.TLabel").grid(row=0, column=0, columnspan=4, sticky="w")

        self.var_default_provider = tk.StringVar()
        self.var_default_model = tk.StringVar()
        self.var_port = tk.StringVar()
        self.var_node_env = tk.StringVar()

        ttk.Label(defaults, text="DEFAULT_PROVIDER").grid(row=1, column=0, sticky="w", pady=(10, 2))
        self.cmb_provider = ttk.Combobox(defaults, textvariable=self.var_default_provider, state="readonly",
                                        values=["nvidia", "groq", "deepseek", "qwen", "openrouter"])
        self.cmb_provider.grid(row=2, column=0, sticky="ew", padx=(0, 10))

        ttk.Label(defaults, text="DEFAULT_MODEL").grid(row=1, column=1, sticky="w", pady=(10, 2))
        self.ent_model = ttk.Entry(defaults, textvariable=self.var_default_model)
        self.ent_model.grid(row=2, column=1, sticky="ew", padx=(0, 10))

        ttk.Label(defaults, text="PORT").grid(row=1, column=2, sticky="w", pady=(10, 2))
        self.ent_port = ttk.Entry(defaults, textvariable=self.var_port, width=10)
        self.ent_port.grid(row=2, column=2, sticky="ew", padx=(0, 10))

        ttk.Label(defaults, text="NODE_ENV").grid(row=1, column=3, sticky="w", pady=(10, 2))
        self.cmb_env = ttk.Combobox(defaults, textvariable=self.var_node_env, state="readonly",
                                    values=["development", "production", "test"])
        self.cmb_env.grid(row=2, column=3, sticky="ew")

        ttk.Label(defaults, text="Model examples: nvidia: z-ai/glm5 or minimaxai/minimax-m2.7 | groq: llama-3.3-70b-versatile | deepseek: deepseek-chat | qwen: qwen-turbo | openrouter: qwen/qwen3-coder:free",
                  wraplength=760, justify="left").grid(row=3, column=0, columnspan=4, sticky="w", pady=(10, 0))

        # System
        system = ttk.Frame(tab, style="Card.TFrame", padding=14)
        system.grid(row=2, column=0, sticky="nsew", pady=(12, 0))
        system.columnconfigure(1, weight=1)

        ttk.Label(system, text="System", style="CardTitle.TLabel").grid(row=0, column=0, columnspan=2, sticky="w")

        self.var_autostart = tk.BooleanVar(value=False)
        self.var_close_to_tray = tk.BooleanVar(value=False)

        chk1 = ttk.Checkbutton(system, text="Run on Windows startup (HKCU Run)", variable=self.var_autostart, command=self.apply_autostart)
        chk1.grid(row=1, column=0, columnspan=2, sticky="w", pady=(10, 4))

        chk2 = ttk.Checkbutton(system, text="Minimize to tray when closing (requires pystray)", variable=self.var_close_to_tray)
        chk2.grid(row=2, column=0, columnspan=2, sticky="w")

        ttk.Label(system, text="Note: tray mode is optional; if dependency is missing, close will prompt instead.",
                  wraplength=760, justify="left").grid(row=3, column=0, columnspan=2, sticky="w", pady=(8, 0))

    def _build_logs_tab(self):
        tab = self.tab_logs
        tab.columnconfigure(0, weight=1)
        tab.rowconfigure(1, weight=1)

        toolbar = ttk.Frame(tab)
        toolbar.grid(row=0, column=0, sticky="ew")
        toolbar.columnconfigure(0, weight=1)

        self.var_autoscroll = tk.BooleanVar(value=True)
        ttk.Checkbutton(toolbar, text="Auto-scroll", variable=self.var_autoscroll).grid(row=0, column=0, sticky="w")
        ttk.Button(toolbar, text="Clear", command=self.clear_logs).grid(row=0, column=1, sticky="e", padx=(8, 0))
        ttk.Button(toolbar, text="Copy all", command=self.copy_logs).grid(row=0, column=2, sticky="e", padx=(8, 0))

        frame = ttk.Frame(tab)
        frame.grid(row=1, column=0, sticky="nsew", pady=(10, 0))
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(0, weight=1)

        self.txt_logs = tk.Text(frame, wrap="word", height=20, bg="#07101e", fg="#d7e3ff",
                                insertbackground="#d7e3ff", relief="flat")
        self.txt_logs.grid(row=0, column=0, sticky="nsew")

        yscroll = ttk.Scrollbar(frame, orient="vertical", command=self.txt_logs.yview)
        yscroll.grid(row=0, column=1, sticky="ns")
        self.txt_logs.configure(yscrollcommand=yscroll.set)

        self._append_log("Launcher ready.\n")

    def _add_labeled_entry(self, parent, row, label, var, secret=False, hint=""):
        ttk.Label(parent, text=label).grid(row=row * 2 - 1, column=0, sticky="w", pady=(10, 2))
        entry = ttk.Entry(parent, textvariable=var, show="*" if secret else "")
        entry.grid(row=row * 2, column=0, columnspan=2, sticky="ew")
        if hint:
            ttk.Label(parent, text=hint, foreground="#9fb2d1").grid(row=row * 2 + 1, column=0, columnspan=2, sticky="w", pady=(2, 0))

    def _load_initial_values(self):
        env = self._read_env()
        self.var_telegram_token.set(env.get("TELEGRAM_BOT_TOKEN", ""))
        self.var_groq_key.set(env.get("GROQ_API_KEY", ""))
        self.var_deepseek_key.set(env.get("DEEPSEEK_API_KEY", ""))
        self.var_qwen_key.set(env.get("QWEN_API_KEY", ""))
        self.var_openrouter_key.set(env.get("OPENROUTER_API_KEY", ""))
        self.var_nvidia_key.set(env.get("NVIDIA_API_KEY", ""))
        self.var_nvidia_base_url.set(env.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"))
        self.var_nvidia_model.set(env.get("NVIDIA_MODEL", "z-ai/glm5"))

        self.var_default_provider.set(env.get("DEFAULT_PROVIDER", "groq"))
        self.var_default_model.set(env.get("DEFAULT_MODEL", env.get("GROQ_MODEL", "llama-3.3-70b-versatile")))
        self.var_port.set(str(env.get("PORT", "3000")))
        self.var_node_env.set(env.get("NODE_ENV", "development"))

        settings = self._read_settings()
        self.var_autostart.set(bool(settings.get("autostart", False)))
        self.var_close_to_tray.set(bool(settings.get("closeToTray", False)))

        # apply autostart toggle to reflect current state
        self.apply_autostart()

    def _read_settings(self):
        try:
            with open(self.settings_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_settings(self, settings):
        tmp = dict(settings)
        try:
            with open(self.settings_path, "w", encoding="utf-8") as f:
                json.dump(tmp, f, ensure_ascii=False, indent=2)
        except Exception as e:
            self._append_log(f"[launcher] Failed to write settings: {e}\n")

    def _read_env(self):
        env = {}
        if not os.path.exists(self.env_path):
            return env
        try:
            with open(self.env_path, "r", encoding="utf-8") as f:
                for raw in f.read().splitlines():
                    line = raw.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
        except Exception as e:
            self._append_log(f"[env] Failed to read .env: {e}\n")
        return env

    def _write_env_merge(self, updates: dict):
        env = self._read_env()
        for k, v in updates.items():
            if v is None:
                continue
            env[k] = str(v).strip()

        lines = []
        lines.append("# Generated/updated by launcher.py")
        lines.append("")
        # Stable ordering (important keys first)
        preferred = [
            "TELEGRAM_BOT_TOKEN",
            "GROQ_API_KEY", "GROQ_MODEL",
            "DEEPSEEK_API_KEY", "DEEPSEEK_MODEL",
            "QWEN_API_KEY", "QWEN_MODEL",
            "OPENROUTER_API_KEY", "OPENROUTER_MODEL",
            "NVIDIA_API_KEY", "NVIDIA_BASE_URL", "NVIDIA_MODEL",
            "DEFAULT_PROVIDER", "DEFAULT_MODEL",
            "PORT", "NODE_ENV",
        ]
        used = set()
        for k in preferred:
            if k in env and env[k] != "":
                lines.append(f"{k}={env[k]}")
                used.add(k)
        # append rest
        rest = sorted([k for k in env.keys() if k not in used])
        if rest:
            lines.append("")
            for k in rest:
                lines.append(f"{k}={env[k]}")
        lines.append("")
        with open(self.env_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

    def save_all(self):
        try:
            port = int(self.var_port.get().strip() or "3000")
            if port <= 0 or port > 65535:
                raise ValueError("Invalid port")
        except Exception:
            messagebox.showerror("Invalid PORT", "PORT must be a number between 1 and 65535.")
            return

        updates = {
            "TELEGRAM_BOT_TOKEN": self.var_telegram_token.get().strip(),
            "GROQ_API_KEY": self.var_groq_key.get().strip(),
            "DEEPSEEK_API_KEY": self.var_deepseek_key.get().strip(),
            "QWEN_API_KEY": self.var_qwen_key.get().strip(),
            "OPENROUTER_API_KEY": self.var_openrouter_key.get().strip(),
            "NVIDIA_API_KEY": self.var_nvidia_key.get().strip(),
            "NVIDIA_BASE_URL": self.var_nvidia_base_url.get().strip() or "https://integrate.api.nvidia.com/v1",
            "NVIDIA_MODEL": self.var_nvidia_model.get().strip() or "z-ai/glm5",
            "DEFAULT_PROVIDER": self.var_default_provider.get().strip() or "groq",
            "DEFAULT_MODEL": self.var_default_model.get().strip(),
            "PORT": str(port),
            "NODE_ENV": self.var_node_env.get().strip() or "development",
        }
        self._write_env_merge(updates)
        self._write_settings({
            "autostart": bool(self.var_autostart.get()),
            "closeToTray": bool(self.var_close_to_tray.get()),
        })
        self.status_var.set("Saved")
        self._append_log("[launcher] Settings saved.\n")

    def start_bot(self):
        if self.process and self.process.poll() is None:
            self.status_var.set("Already running")
            return

        if not self.var_telegram_token.get().strip():
            messagebox.showerror("Missing token", "Please set TELEGRAM_BOT_TOKEN in Settings.")
            self.notebook.select(self.tab_settings)
            return

        self.save_all()

        self.btn_start.config(state="disabled")
        self.btn_stop.config(state="normal")
        self.btn_restart.config(state="normal")
        self.status_var.set("Starting…")

        thread = threading.Thread(target=self._start_process_worker)
        thread.daemon = True
        thread.start()

    def _start_process_worker(self):
        try:
            creationflags = 0
            if os.name == "nt":
                creationflags = subprocess.CREATE_NO_WINDOW
            self._append_log("[run] Starting `npm start`…\n")
            self.process = subprocess.Popen(
                ["npm", "start"],
                cwd=self.project_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                creationflags=creationflags,
            )
            self._append_log(f"[run] pid={self.process.pid}\n")
            self.root.after(0, lambda: self.status_var.set("Running"))
            self._start_stdout_reader()
        except Exception as e:
            self._append_log(f"[run] Failed to start: {e}\n")
            self.root.after(0, lambda: self.status_var.set("Start failed"))
            self.root.after(0, lambda: self._set_buttons_stopped())

    def _start_stdout_reader(self):
        if not self.process or not self.process.stdout:
            return
        self._stdout_thread = threading.Thread(target=self._stdout_reader_loop, daemon=True)
        self._stdout_thread.start()
        if self._log_pump_job is None:
            self._pump_logs()

    def _stdout_reader_loop(self):
        try:
            assert self.process is not None and self.process.stdout is not None
            for line in self.process.stdout:
                self.log_queue.put(line)
        except Exception as e:
            self.log_queue.put(f"[run] stdout reader error: {e}\n")
        finally:
            rc = None
            try:
                if self.process is not None:
                    rc = self.process.poll()
            except Exception:
                rc = None
            self.log_queue.put(f"\n[run] Process exited (code={rc}).\n")
            self.root.after(0, self._set_buttons_stopped)
            self.root.after(0, lambda: self.status_var.set("Stopped"))

    def _pump_logs(self):
        drained = 0
        try:
            while True:
                chunk = self.log_queue.get_nowait()
                self._append_log(chunk)
                drained += 1
                if drained > 200:
                    break
        except queue.Empty:
            pass
        self._log_pump_job = self.root.after(80, self._pump_logs)

    def stop_bot(self):
        if not self.process or self.process.poll() is not None:
            self._set_buttons_stopped()
            self.status_var.set("Stopped")
            return

        pid = self.process.pid
        self._append_log(f"[run] Stopping pid={pid}…\n")
        try:
            if os.name == "nt":
                subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True, text=True)
            else:
                self.process.terminate()
            time.sleep(0.2)
        except Exception as e:
            self._append_log(f"[run] Stop error: {e}\n")

    def restart_bot(self):
        self.stop_bot()
        self.root.after(600, self.start_bot)

    def _set_buttons_stopped(self):
        self.btn_start.config(state="normal")
        self.btn_stop.config(state="disabled")
        self.btn_restart.config(state="disabled")

    def _append_log(self, text: str):
        try:
            self.txt_logs.insert("end", text)
            if self.var_autoscroll.get():
                self.txt_logs.see("end")
        except Exception:
            pass

    def clear_logs(self):
        self.txt_logs.delete("1.0", "end")
        self._append_log("Logs cleared.\n")

    def copy_logs(self):
        content = self.txt_logs.get("1.0", "end")
        self.root.clipboard_clear()
        self.root.clipboard_append(content)
        self.status_var.set("Copied logs")

    def open_logs_folder(self):
        logs_dir = os.path.join(self.project_dir, "logs")
        try:
            os.makedirs(logs_dir, exist_ok=True)
        except Exception:
            pass
        try:
            if os.name == "nt":
                os.startfile(logs_dir)  # type: ignore
            else:
                subprocess.Popen(["open", logs_dir])
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open logs folder: {e}")

    def apply_autostart(self):
        if os.name != "nt" or winreg is None:
            return
        enabled = bool(self.var_autostart.get())
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE)
            app_name = "TelegramAIAssistant"
            script_path = os.path.abspath(__file__)
            cmd = f"\"{sys.executable}\" \"{script_path}\""
            if enabled:
                # Use pythonw if available to avoid console window
                python_exe = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
                if python_exe and os.path.exists(python_exe):
                    cmd = f"\"{python_exe}\" \"{script_path}\""
                winreg.SetValueEx(key, app_name, 0, winreg.REG_SZ, cmd)
                self._append_log("[system] Autostart enabled.\n")
            else:
                try:
                    winreg.DeleteValue(key, app_name)
                except FileNotFoundError:
                    pass
                self._append_log("[system] Autostart disabled.\n")
            winreg.CloseKey(key)
        except Exception as e:
            self._append_log(f"[system] Autostart config failed: {e}\n")

    def on_close(self):
        running = self.process and self.process.poll() is None
        if running and self.var_close_to_tray.get():
            # Optional tray feature; if missing dependency, fall back to prompt.
            try:
                import pystray  # type: ignore
                from PIL import Image  # type: ignore
            except Exception:
                pass
            else:
                self.root.withdraw()
                self.status_var.set("Running (tray)")
                self._append_log("[system] Window hidden (tray requested).\n")
                return

        if running:
            res = messagebox.askyesnocancel("Bot is running", "Bot is still running.\n\nYes: Stop and exit\nNo: Exit (leave running)\nCancel: Don't exit")
            if res is None:
                return
            if res is True:
                self.stop_bot()
                self.root.after(500, self.root.destroy)
                return
            self.root.destroy()
            return

        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = TelegramBotLauncher(root)
    root.mainloop()