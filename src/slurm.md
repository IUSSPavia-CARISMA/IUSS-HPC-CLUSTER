# SLURM 

A good place to start is to inspect the cluster you are actually using.

```bash
scontrol show node 
```

Example summary
```
Partitions: cpu, gpu, long
Nodes:      cpu001-cpu008, gpu001-gpu002
CPUs/node:  inspect with `scontrol show node`
MaxArray:   inspect your local limits
```

If you want to know node states:

```bash
sinfo -o '%N %t %C %m'
```

> **Tip:** `mix` = partially allocated. `alloc` = zero idle CPUs. Submit to a `mix` or `idle` node; SLURM handles placement.

you can as well see how many CPU are occupied and how many are free.

```bash
sinfo -N -o "%N %t %c %C %m"
```

If you want to narrow down to a specific node:

```bash
scontrol show node <nodename>
scontrol show node cpu003
```

## The Most Important Distinction: Account ≠ Partition

There is a high chance that you are in  **different accounts** with different wall-time limits:

| Account | Max wall time | How to use |
|---------|--------------|------------|
| `default` | site-specific | Applied automatically if you do not specify |
| `project123` | site-specific | Must explicitly add `--account=project123` |


Always confirm the right account for your project with your administrators or `sacctmgr`.

Check your own account associations:

```bash
sacctmgr show association user=$USER format=account,partition,qos,maxwall
```

**If your job sits in PENDING with reason `AssocMaxWallDurationPerJobLimit`, your requested `--time` exceeds your account limit.** The fix is often to use the correct account:

```bash
#SBATCH --partition=cpu
#SBATCH --account=project123
#SBATCH --time=2-00:00:00
```
## Submit, Inspect, Cancel

```bash
sbatch run_job.sh          # submit
squeue -u $USER            # what is alive right now
sacct -j 12345 -X          # what actually happened (includes finished/failed)
scancel 12345              # cancel one job
scancel 12345 12346        # cancel multiple at once
```

**`squeue` only shows running/pending jobs.** Once a job ends it disappears. Use `sacct` to see completed, failed, timed-out jobs — always check this before concluding a job "just vanished":

```bash
sacct -u $USER --starttime=now-24hours \
  --format=JobID,JobName,State,ExitCode,Elapsed -X
```

Common states in `sacct`:

| State | Meaning | What to do |
|-------|---------|------------|
| `COMPLETED` | Exited 0 | Check results |
| `FAILED` | Non-zero exit | Read the `.err` log |
| `TIMEOUT` | Hit wall time | Increase `--time` or split workload |
| `CANCELLED` | Manually killed | Normal |
| `NODE_FAIL` | Hardware fault | Resubmit |
| `PENDING` reason `AssocMaxWallDurationPerJobLimit` | `--time` > account max | Add the correct `--account` |

Required header for every job
```bash
#!/bin/bash
#SBATCH --job-name=my_job
#SBATCH --output=logs/%x_%j.log      # %x = job name, %j = job ID
#SBATCH --error=logs/%x_%j.err
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=16G
#SBATCH --time=06:00:00
#SBATCH --partition=cpu
#SBATCH --account=project123

set -euo pipefail                    # fail fast — don't silently continue on errors

mkdir -p logs                        # ensure logs directory exists
cd /path/to/project || exit 1

###############################################
# Activate your environment (choose ONE)
###############################################

### Option A: Activate a Conda environment
# module load anaconda3            
# source ~/miniconda3/etc/profile.d/conda.sh
# conda activate project-env       # replace with your environment name

### Option B: Activate a Python venv
# source .venv/bin/activate        # replace with your venv path

###############################################
# Set the path to your R or Python script
###############################################

# For Python:
# PY_SCRIPT="/path/to/project/scripts/run_model.py"

# For R:
# R_SCRIPT="/path/to/project/scripts/run_analysis.R"
```


If you want to run Python with Conda, uncomment:
```bash
source ~/miniconda3/etc/profile.d/conda.sh
conda activate project-env
PY_SCRIPT="/path/to/project/scripts/run_model.py"

```
at the bottom of the script 

```bash 
python "$PY_SCRIPT"
```

If you want to run Python with venv

```bash 
source .venv/bin/activate
PY_SCRIPT="/path/to/project/scripts/run_model.py"
```

then

```bash 
python "$PY_SCRIPT"
```

same goes to R what changes 

```bash 
Rscript "$R_SCRIPT"
```

> 🍃 **Tip**
> You can use the [Sbatch Builder](./sbatch-builder.md) to help you come up with a quick fast header.

## CPUs: What You Ask For vs What Gets Used

```bash
#SBATCH --cpus-per-task=8    # reserves 8 cores on the node for this task
#SBATCH --ntasks=1           # 1 task (process)
```

- **`--cpus-per-task`** controls how many cores SLURM reserves — it directly affects **node placement**.
- R and Python are single-threaded by default. You are paying for cores you are not using.
- **But the number you request controls how many tasks land on each node.** This is critical for job arrays.

**Rule of thumb:** tune `--cpus-per-task` to match both your software behavior and your site policy.

| cpus-per-task | Max tasks per node | Spread behaviour |
|---|---|---|
| 1 | site-specific | Often packs many tasks onto one node |
| 4 | site-specific | Moderate spread |
| 8 | site-specific | Wider spread |
| full node | site-specific | Exclusive or near-exclusive placement |

If you have any shared I/O between tasks, **request 8+ CPUs per task** to force SLURM to spread tasks across nodes and avoid resource contention — even if your process only uses 1 core.


## Job Arrays is the right way to parallelise

Use arrays when you have N independent jobs that differ only by an index (different starting points, folds, seeds, etc.).

```bash
#SBATCH --array=1-8                  # runs tasks 1, 2, 3 ... 8
#SBATCH --array=1-8%4                # runs at most 4 simultaneously
#SBATCH --array=1-3                  # 3 tasks (e.g. for CRS2-LM global)
```

Inside the script, the current task index is `$SLURM_ARRAY_TASK_ID`:

```bash
export START_IDX=$SLURM_ARRAY_TASK_ID
export TASK_RUNS_DIR="runs/algo_s${SLURM_ARRAY_TASK_ID}"
mkdir -p "$TASK_RUNS_DIR"
Rscript --vanilla scripts/my_calibration.R
```

Log naming for arrays — use both job array ID (`%A`) and task ID (`%a`):

```bash
#SBATCH --output=logs/myjob_%A_%a.log
#SBATCH --error=logs/myjob_%A_%a.err
```

This gives you `logs/myjob_12345_1.log`, `logs/myjob_12345_2.log`, etc. — one file per task.

**Arrays are cleaner than N copied scripts and avoid the wall-time problem**: instead of one job running N starts sequentially (hitting the wall-time limit after 2), you run N jobs in parallel — each start on its own node, each using only the time it actually needs.


## Excluding Problematic Nodes

If specific nodes are overloaded or have known issues, exclude them explicitly:

```bash
#SBATCH --exclude=cpu003,cpu008
```

Check which nodes are fully allocated before submitting:

```bash
sinfo -o '%N %t %C'
# Look for 'alloc' state = zero idle CPUs
```

---

## Dependencies — Chaining Jobs

```bash
job1=$(sbatch --parsable preprocess.sh)
sbatch --dependency=afterok:${job1} analyze.sh
```

- `afterok`: only run if previous job succeeded (exit 0)
- `afterany`: run regardless of outcome
- `afternotok`: only run if previous job failed

Useful for: run calibration → then automatically run validation when calibration finishes.


## Checking What Actually Ran

```bash
# Summary of last 24h
sacct -u $USER --starttime=now-24hours \
  --format=JobID,JobName,Partition,Account,State,ExitCode,Elapsed -X

# Detailed resource usage for a specific job
sacct -j 12345 --format=JobID,CPUTime,MaxRSS,Elapsed,State

# All tasks of an array
sacct -j 12345 --format=JobID,State,ExitCode,Elapsed
```



## Diagnosing Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Exit code 127 | `Rscript` / `python` not in PATH | Add `module load R` / `module load miniconda3` |
| `AssocMaxWallDurationPerJobLimit` | `--time` exceeds account default | Add the correct `--account` |
| Job runs longer than expected then TIMEOUT | Wall time set too low | Increase `--time` within your account limits |
| All array tasks on one node, contention | `--cpus-per-task=1` causes SLURM packing | Use `--cpus-per-task=8` to force spreading |
| Apptainer file conflicts | Tasks sharing `runs/` directory | Give each task `runs/${ALGO}_s${SLURM_ARRAY_TASK_ID}/` |
| Objective = `Inf` | APSIM wrapper crash, params not passed | Check `.err` log; verify `APSIM_EXE` path exists |
| PENDING forever | Node unavailable or resource mismatch | Check `squeue` reason column; try excluding problematic nodes |


## Minimal Working Template

```bash
#!/bin/bash
#SBATCH --job-name=my_array
#SBATCH --output=logs/%x_%A_%a.log
#SBATCH --error=logs/%x_%A_%a.err
#SBATCH --array=1-8
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=16G
#SBATCH --time=2-00:00:00
#SBATCH --partition=cpu
#SBATCH --account=project123
#SBATCH --exclude=cpu003,cpu008

set -euo pipefail
module load R
module load singularity 2>/dev/null || true

cd /path/to/project || exit 1
mkdir -p logs output runs/task_${SLURM_ARRAY_TASK_ID}

export APSIM_EXE="/path/to/project/apsim_wrapper.sh"
export TASK_RUNS_DIR="runs/task_${SLURM_ARRAY_TASK_ID}"
export START_IDX=$SLURM_ARRAY_TASK_ID

echo "Task $START_IDX  Node=$SLURMD_NODENAME  Start=$(date)"
Rscript --vanilla scripts/my_script.R
echo "Done $START_IDX  $(date)"
```


## Quick Reference

```bash
# Submit
sbatch run_job.sh

# Monitor
squeue -u $USER -o '%.10i %.14j %.8T %.10M %N'
sacct -u $USER --starttime=now-24hours --format=JobID,JobName,State,ExitCode,Elapsed -X

# Cancel
scancel 12345                    # one job
scancel 12345 12346 12347        # several at once

# Check node availability
sinfo -o '%N %t %C'              # CPUS: Allocated/Idle/Other/Total

# Check your account limits
sacctmgr show association user=$USER format=account,partition,qos,maxwall
```
<div class="home-links">
  <a class="home-link-pill" href="./sbatch-builder.md">Open Sbatch Builder</a>
  <a class="home-link-pill" href="./index.md">Home</a>
</div>
