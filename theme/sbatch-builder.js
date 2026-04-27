document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("sbatch-builder-root");
    if (!root) return;

    root.innerHTML = `
<section class="tool-shell">
  <article class="tool-card">
    <div class="tool-card-body">
      <h2>Recommended Template Builder</h2>
      <p class="tool-note">This form starts from the recommended Slurm array template in the guide and lets you swap in your own values.</p>
      <div class="tool-grid">
        <label class="tool-field">
          <span class="tool-label">Job Name</span>
          <input class="tool-input" id="job-name" type="text" value="my_array">
        </label>
        <label class="tool-field">
          <span class="tool-label">Array Range</span>
          <input class="tool-input" id="array-range" type="text" value="1-8">
        </label>
        <label class="tool-field">
          <span class="tool-label">Partition</span>
          <input class="tool-input" id="partition" type="text" value="cpu">
        </label>
        <label class="tool-field">
          <span class="tool-label">Account</span>
          <input class="tool-input" id="account" type="text" value="project123">
        </label>
        <label class="tool-field">
          <span class="tool-label">Wall Time</span>
          <input class="tool-input" id="time-limit" type="text" value="2-00:00:00">
        </label>
        <label class="tool-field">
          <span class="tool-label">Memory</span>
          <input class="tool-input" id="memory" type="text" value="16G">
        </label>
        <label class="tool-field">
          <span class="tool-label">Nodes</span>
          <input class="tool-input" id="nodes" type="number" min="1" value="1">
        </label>
        <label class="tool-field">
          <span class="tool-label">Tasks</span>
          <input class="tool-input" id="ntasks" type="number" min="1" value="1">
        </label>
        <label class="tool-field">
          <span class="tool-label">CPUs Per Task</span>
          <input class="tool-input" id="cpus-per-task" type="number" min="1" value="8">
        </label>
        <label class="tool-field">
          <span class="tool-label">Exclude Nodes</span>
          <input class="tool-input" id="exclude" type="text" value="cpu003,cpu008">
        </label>
        <label class="tool-field">
          <span class="tool-label">Script Type</span>
          <select class="tool-select" id="script-type">
            <option value="r" selected>R</option>
            <option value="python">Python</option>
            <option value="custom">Custom command</option>
          </select>
        </label>
        <label class="tool-field">
          <span class="tool-label">Conda Environment</span>
          <input class="tool-input" id="conda-env" type="text" placeholder="Optional">
        </label>
        <label class="tool-field tool-field-full">
          <span class="tool-label">Project Directory</span>
          <input class="tool-input" id="workdir" type="text" value="/path/to/project">
        </label>
        <label class="tool-field tool-field-full">
          <span class="tool-label">Script Path</span>
          <input class="tool-input" id="script-path" type="text" value="scripts/my_script.R">
        </label>
        <label class="tool-field tool-field-full">
          <span class="tool-label">APSIM Wrapper Path</span>
          <input class="tool-input" id="apsim-exe" type="text" value="/path/to/project/apsim_wrapper.sh">
        </label>
        <label class="tool-field tool-field-full">
          <span class="tool-label">Modules To Load</span>
          <textarea class="tool-textarea" id="modules">R
singularity 2>/dev/null || true</textarea>
        </label>
        <label class="tool-field tool-field-full">
          <span class="tool-label">Extra Setup Commands</span>
          <textarea class="tool-textarea" id="extra-setup" placeholder="Optional extra commands before the main workload"></textarea>
        </label>
        <label class="tool-field tool-field-full">
          <span class="tool-label">Custom Main Command</span>
          <textarea class="tool-textarea" id="custom-command" placeholder="Used only when Script Type is Custom"></textarea>
        </label>
      </div>
      <div class="tool-actions">
        <button class="tool-btn tool-btn-primary" id="generate-sbatch" type="button">Generate Script</button>
        <button class="tool-btn" id="load-r-template" type="button">Load R Template</button>
        <button class="tool-btn" id="load-python-template" type="button">Load Python Template</button>
      </div>
      <p class="tool-status" id="tool-status">Template loaded.</p>
    </div>
  </article>
  <aside class="tool-card">
    <div class="tool-card-body">
      <div class="tool-output-head">
        <h2>Generated Script</h2>
        <span class="tool-badge">Guide-Aligned</span>
      </div>
      <pre class="tool-output"><code id="sbatch-output">Generating initial script...</code></pre>
      <div class="tool-output-actions">
        <button class="tool-btn tool-btn-primary" id="copy-script" type="button">Copy</button>
        <button class="tool-btn" id="download-script" type="button">Download</button>
      </div>
      <div class="tool-notes">
        <p class="tool-note">The defaults mirror the minimal array-job template from the Slurm guide.</p>
        <p class="tool-note">Update partition, account, node exclusions, modules, and commands to match your real cluster.</p>
      </div>
    </div>
  </aside>
</section>`;

    const fields = {
        jobName: document.getElementById("job-name"),
        arrayRange: document.getElementById("array-range"),
        partition: document.getElementById("partition"),
        account: document.getElementById("account"),
        timeLimit: document.getElementById("time-limit"),
        memory: document.getElementById("memory"),
        nodes: document.getElementById("nodes"),
        ntasks: document.getElementById("ntasks"),
        cpusPerTask: document.getElementById("cpus-per-task"),
        exclude: document.getElementById("exclude"),
        scriptType: document.getElementById("script-type"),
        condaEnv: document.getElementById("conda-env"),
        workdir: document.getElementById("workdir"),
        scriptPath: document.getElementById("script-path"),
        apsimExe: document.getElementById("apsim-exe"),
        modules: document.getElementById("modules"),
        extraSetup: document.getElementById("extra-setup"),
        customCommand: document.getElementById("custom-command")
    };

    const output = document.getElementById("sbatch-output");
    const status = document.getElementById("tool-status");

    function valueOf(key) {
        return fields[key].value.trim();
    }

    function setField(key, value) {
        fields[key].value = value;
    }

    function setStatus(message) {
        status.textContent = message;
    }

    function appendDirective(lines, flag, value) {
        if (value) {
            lines.push("#SBATCH " + flag + "=" + value);
        }
    }

    function splitNonEmptyLines(value) {
        return value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }

    function inferCommand() {
        const scriptType = valueOf("scriptType");
        const scriptPath = valueOf("scriptPath");

        if (scriptType === "custom") {
            return valueOf("customCommand") || "echo \"Add your workload command here\"";
        }

        if (scriptType === "python") {
            return "python " + (scriptPath || "scripts/my_script.py");
        }

        return "Rscript --vanilla " + (scriptPath || "scripts/my_script.R");
    }

    function buildScript() {
        const jobName = valueOf("jobName") || "my_array";
        const arrayRange = valueOf("arrayRange") || "1-8";
        const workdir = valueOf("workdir") || "/path/to/project";
        const script = [
            "#!/bin/bash",
            "#SBATCH --job-name=" + jobName,
            "#SBATCH --output=logs/%x_%A_%a.log",
            "#SBATCH --error=logs/%x_%A_%a.err",
            "#SBATCH --array=" + arrayRange,
            "#SBATCH --nodes=" + (valueOf("nodes") || "1"),
            "#SBATCH --ntasks=" + (valueOf("ntasks") || "1"),
            "#SBATCH --cpus-per-task=" + (valueOf("cpusPerTask") || "8"),
            "#SBATCH --mem=" + (valueOf("memory") || "16G"),
            "#SBATCH --time=" + (valueOf("timeLimit") || "2-00:00:00")
        ];

        appendDirective(script, "--partition", valueOf("partition"));
        appendDirective(script, "--account", valueOf("account"));
        appendDirective(script, "--exclude", valueOf("exclude"));

        script.push(
            "",
            "set -euo pipefail"
        );

        const moduleLines = splitNonEmptyLines(valueOf("modules"));
        if (moduleLines.length > 0) {
            script.push("");
            moduleLines.forEach((line) => {
                script.push("module load " + line);
            });
        }

        if (valueOf("condaEnv")) {
            script.push(
                "",
                'source "$(conda info --base)/etc/profile.d/conda.sh"',
                "conda activate " + valueOf("condaEnv")
            );
        }

        script.push(
            "",
            'cd "' + workdir + '" || exit 1',
            'mkdir -p logs output runs/task_${SLURM_ARRAY_TASK_ID}',
            "",
            'export APSIM_EXE="' + (valueOf("apsimExe") || "/path/to/project/apsim_wrapper.sh") + '"',
            'export TASK_RUNS_DIR="runs/task_${SLURM_ARRAY_TASK_ID}"',
            "export START_IDX=$SLURM_ARRAY_TASK_ID",
            "",
            'echo "Task $START_IDX  Node=$SLURMD_NODENAME  Start=$(date)"'
        );

        const extraSetupLines = splitNonEmptyLines(valueOf("extraSetup"));
        if (extraSetupLines.length > 0) {
            script.push("", "# Extra setup");
            extraSetupLines.forEach((line) => {
                script.push(line);
            });
        }

        script.push(
            "",
            "# Main workload",
            inferCommand(),
            'echo "Done $START_IDX  $(date)"'
        );

        return {
            jobName,
            text: script.join("\n")
        };
    }

    function renderScript() {
        const script = buildScript();
        output.textContent = script.text;
        return script;
    }

    function renderFromUserInput() {
        renderScript();
        setStatus("Preview updated from your inputs.");
    }

    function loadRTemplate() {
        setField("jobName", "my_array");
        setField("arrayRange", "1-8");
        setField("partition", "cpu");
        setField("account", "project123");
        setField("timeLimit", "2-00:00:00");
        setField("memory", "16G");
        setField("nodes", "1");
        setField("ntasks", "1");
        setField("cpusPerTask", "8");
        setField("exclude", "cpu003,cpu008");
        setField("scriptType", "r");
        setField("condaEnv", "");
        setField("workdir", "/path/to/project");
        setField("scriptPath", "scripts/my_script.R");
        setField("apsimExe", "/path/to/project/apsim_wrapper.sh");
        setField("modules", "R\nsingularity 2>/dev/null || true");
        setField("extraSetup", "");
        setField("customCommand", "");
        renderScript();
        setStatus("Recommended R template loaded.");
    }

    function loadPythonTemplate() {
        setField("jobName", "my_array");
        setField("arrayRange", "1-8");
        setField("partition", "cpu");
        setField("account", "project123");
        setField("timeLimit", "2-00:00:00");
        setField("memory", "16G");
        setField("nodes", "1");
        setField("ntasks", "1");
        setField("cpusPerTask", "8");
        setField("exclude", "cpu003,cpu008");
        setField("scriptType", "python");
        setField("condaEnv", "project-env");
        setField("workdir", "/path/to/project");
        setField("scriptPath", "scripts/run_model.py");
        setField("apsimExe", "/path/to/project/apsim_wrapper.sh");
        setField("modules", "python/3.11");
        setField("extraSetup", "python --version");
        setField("customCommand", "");
        renderScript();
        setStatus("Python template loaded.");
    }

    document.getElementById("generate-sbatch").addEventListener("click", () => {
        renderScript();
        setStatus("Script regenerated.");
    });

    document.getElementById("load-r-template").addEventListener("click", () => {
        loadRTemplate();
    });

    document.getElementById("load-python-template").addEventListener("click", () => {
        loadPythonTemplate();
    });

    Object.values(fields).forEach((field) => {
        const eventName = field.tagName === "SELECT" ? "change" : "input";
        field.addEventListener(eventName, renderFromUserInput);
        if (eventName !== "change") {
            field.addEventListener("change", renderFromUserInput);
        }
    });

    document.getElementById("copy-script").addEventListener("click", async () => {
        const script = renderScript();
        await navigator.clipboard.writeText(script.text);
        setStatus("Script copied to clipboard.");
    });

    document.getElementById("download-script").addEventListener("click", () => {
        const script = buildScript();
        const blob = new Blob([script.text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = script.jobName + ".sbatch";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        setStatus('Downloaded "' + script.jobName + '.sbatch".');
    });

    loadRTemplate();
});
