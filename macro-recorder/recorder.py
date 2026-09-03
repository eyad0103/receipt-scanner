"""
Macro Recorder - Records keyboard and mouse actions with precise timing.
F8 starts recording, F9 stops recording and replays.
"""

import time
import threading
import json
import tkinter as tk
from tkinter import messagebox
from pynput import keyboard, mouse


class MacroRecorder:
    def __init__(self):
        self.events = []
        self.recording = False
        self.replaying = False
        self.start_time = 0
        self.kb_listener = None
        self.ms_listener = None
        self.recorded_keys = set()

    def start_recording(self):
        if self.recording:
            return
        self.events = []
        self.recorded_keys = set()
        self.recording = True
        self.start_time = time.time()

        self.kb_listener = keyboard.Listener(
            on_press=self._on_key_press,
            on_release=self._on_key_release,
            suppress=False
        )
        self.ms_listener = mouse.Listener(
            on_click=self._on_click,
            on_scroll=self._on_scroll,
            on_move=self._on_move
        )
        self.kb_listener.start()
        self.ms_listener.start()

    def stop_recording(self):
        if not self.recording:
            return
        self.recording = False
        if self.kb_listener:
            self.kb_listener.stop()
            self.kb_listener = None
        if self.ms_listener:
            self.ms_listener.stop()
            self.ms_listener = None

    def _elapsed(self):
        return time.time() - self.start_time

    def _on_key_press(self, key):
        if not self.recording:
            return
        if key == keyboard.Key.f8:
            return
        if key == keyboard.Key.f9:
            self.stop_recording()
            return
        try:
            k = key.char
        except AttributeError:
            k = str(key)
        if k in self.recorded_keys:
            return
        self.recorded_keys.add(k)
        self.events.append({
            'type': 'key_press',
            'key': k,
            'time': self._elapsed()
        })

    def _on_key_release(self, key):
        if not self.recording:
            return
        if key == keyboard.Key.f8 or key == keyboard.Key.f9:
            return
        try:
            k = key.char
        except AttributeError:
            k = str(key)
        self.recorded_keys.discard(k)
        self.events.append({
            'type': 'key_release',
            'key': k,
            'time': self._elapsed()
        })

    def _on_click(self, x, y, button, pressed):
        if not self.recording:
            return
        event_type = 'mouse_press' if pressed else 'mouse_release'
        self.events.append({
            'type': event_type,
            'x': x,
            'y': y,
            'button': str(button),
            'time': self._elapsed()
        })

    def _on_scroll(self, x, y, dx, dy):
        if not self.recording:
            return
        self.events.append({
            'type': 'mouse_scroll',
            'x': x,
            'y': y,
            'dx': dx,
            'dy': dy,
            'time': self._elapsed()
        })

    def _on_move(self, x, y):
        if not self.recording:
            return
        t = self._elapsed()
        if self.events and self.events[-1]['type'] == 'mouse_move':
            if t - self.events[-1]['time'] < 0.01:
                return
        self.events.append({
            'type': 'mouse_move',
            'x': x,
            'y': y,
            'time': t
        })

    def replay(self):
        if not self.events:
            return
        self.replaying = True
        mouse_controller = mouse.Controller()
        keyboard_controller = keyboard.Controller()

        prev_time = 0
        for event in self.events:
            delay = event['time'] - prev_time
            if delay > 0:
                time.sleep(delay)
            prev_time = event['time']

            etype = event['type']
            if etype == 'key_press':
                try:
                    keyboard_controller.press(event['key'])
                except Exception:
                    pass
            elif etype == 'key_release':
                try:
                    keyboard_controller.release(event['key'])
                except Exception:
                    pass
            elif etype == 'mouse_press':
                mouse_controller.position = (event['x'], event['y'])
                btn = mouse.Button.left if 'left' in event['button'] else (
                    mouse.Button.right if 'right' in event['button'] else mouse.Button.middle
                )
                mouse_controller.press(btn)
            elif etype == 'mouse_release':
                mouse_controller.position = (event['x'], event['y'])
                btn = mouse.Button.left if 'left' in event['button'] else (
                    mouse.Button.right if 'right' in event['button'] else mouse.Button.middle
                )
                mouse_controller.release(btn)
            elif etype == 'mouse_move':
                mouse_controller.position = (event['x'], event['y'])
            elif etype == 'mouse_scroll':
                mouse_controller.position = (event['x'], event['y'])
                mouse_controller.scroll(event['dx'], event['dy'])

        self.replaying = False

    def save(self, filepath):
        with open(filepath, 'w') as f:
            json.dump(self.events, f, indent=2)

    def load(self, filepath):
        with open(filepath, 'r') as f:
            self.events = json.load(f)


class App:
    def __init__(self):
        self.recorder = MacroRecorder()
        self.root = tk.Tk()
        self.root.title("Macro Recorder")
        self.root.geometry("400x300")
        self.root.resizable(False, False)

        self.status_var = tk.StringVar(value="Ready - Press F8 to start recording")

        tk.Label(
            self.root, text="Macro Recorder", font=("Segoe UI", 16, "bold")
        ).pack(pady=(15, 5))

        tk.Label(
            self.root,
            text="F8 = Start Recording\nF9 = Stop Recording",
            font=("Segoe UI", 10),
            fg="#666"
        ).pack(pady=(0, 10))

        btn_frame = tk.Frame(self.root)
        btn_frame.pack(pady=10)

        self.record_btn = tk.Button(
            btn_frame, text="Record (F8)", width=14, height=2,
            bg="#e74c3c", fg="white", font=("Segoe UI", 10, "bold"),
            command=self.toggle_recording
        )
        self.record_btn.grid(row=0, column=0, padx=5)

        self.replay_btn = tk.Button(
            btn_frame, text="Replay", width=14, height=2,
            bg="#2ecc71", fg="white", font=("Segoe UI", 10, "bold"),
            command=self.start_replay, state="disabled"
        )
        self.replay_btn.grid(row=0, column=1, padx=5)

        self.save_btn = tk.Button(
            btn_frame, text="Save", width=14, height=2,
            bg="#3498db", fg="white", font=("Segoe UI", 10, "bold"),
            command=self.save_macro, state="disabled"
        )
        self.save_btn.grid(row=1, column=0, padx=5, pady=5)

        self.load_btn = tk.Button(
            btn_frame, text="Load", width=14, height=2,
            bg="#9b59b6", fg="white", font=("Segoe UI", 10, "bold"),
            command=self.load_macro
        )
        self.load_btn.grid(row=1, column=1, padx=5, pady=5)

        tk.Label(
            self.root, textvariable=self.status_var,
            font=("Segoe UI", 9), fg="#333", wraplength=380
        ).pack(side="bottom", pady=10)

        self.kb_listener = keyboard.Listener(on_press=self._global_key)
        self.kb_listener.daemon = True
        self.kb_listener.start()

        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def _global_key(self, key):
        if key == keyboard.Key.f8:
            self.root.after(0, self.toggle_recording)
        elif key == keyboard.Key.f9:
            self.root.after(0, self.stop_and_replay)

    def toggle_recording(self):
        if self.recorder.recording:
            self.recorder.stop_recording()
            self.status_var.set(
                f"Recorded {len(self.recorder.events)} events - Press Replay"
            )
            self.record_btn.config(text="Record (F8)", bg="#e74c3c")
            self.replay_btn.config(state="normal")
            self.save_btn.config(state="normal")
        else:
            self.recorder.start_recording()
            self.record_btn.config(text="Stop (F8)", bg="#c0392b")
            self.replay_btn.config(state="disabled")
            self.save_btn.config(state="disabled")
            self.status_var.set("Recording... Press F8 to stop")

    def stop_and_replay(self):
        if self.recorder.recording:
            self.recorder.stop_recording()
            self.status_var.set(
                f"Recorded {len(self.recorder.events)} events"
            )
            self.record_btn.config(text="Record (F8)", bg="#e74c3c")
            self.replay_btn.config(state="normal")
            self.save_btn.config(state="normal")

    def start_replay(self):
        if not self.recorder.events:
            messagebox.showwarning("Warning", "No recorded events to replay.")
            return
        self.replay_btn.config(state="disabled")
        self.record_btn.config(state="disabled")
        self.status_var.set("Replaying...")

        def do_replay():
            self.recorder.replay()
            self.root.after(0, self.replay_done)

        threading.Thread(target=do_replay, daemon=True).start()

    def replay_done(self):
        self.replay_btn.config(state="normal")
        self.record_btn.config(state="normal")
        self.status_var.set("Replay complete!")

    def save_macro(self):
        from tkinter import filedialog
        path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if path:
            self.recorder.save(path)
            self.status_var.set(f"Saved to {path}")

    def load_macro(self):
        from tkinter import filedialog
        path = filedialog.askopenfilename(
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if path:
            self.recorder.load(path)
            self.status_var.set(
                f"Loaded {len(self.recorder.events)} events"
            )
            self.replay_btn.config(state="normal")
            self.save_btn.config(state="normal")

    def on_close(self):
        self.recorder.stop_recording()
        self.root.destroy()

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    App().run()
