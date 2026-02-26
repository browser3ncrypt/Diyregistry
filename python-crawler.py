<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Crawler Launcher</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; line-height: 1.5; }
    pre  { background: #f8f8f8; padding: 16px; border-radius: 6px; overflow-x: auto; }
    button { padding: 12px 24px; font-size: 1.1rem; cursor: pointer; }
  </style>
</head>
<body>

<h1>Website Crawler</h1>

<p>This page cannot run the crawler itself — browsers do not allow it for security reasons.</p>

<p>You need to run the Python script manually:</p>

<ol>
  <li><strong>Download</strong> the crawler script:<br>
    <a href="crawler.py" download="crawler.py">
      <button>↓ Download crawler.py</button>
    </a>
  </li>

  <li><strong>Open a terminal</strong> in the folder where you saved the file</li>

  <li><strong>Run</strong> one of these commands:

<pre><code># Recommended (creates virtual environment)
python -m venv venv
source venv/bin/activate    # Linux/macOS
venv\Scripts\activate       # Windows

pip install -r requirements.txt   # if you have one
python crawler.py
</code></pre>

  or just

<pre><code>python crawler.py</code></pre>

  </li>
</ol>

<p>If you get “command not found” errors, you need to install <a href="https://www.python.org/downloads/">Python</a> first.</p>

</body>
</html>