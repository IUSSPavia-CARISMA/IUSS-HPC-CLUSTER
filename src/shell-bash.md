# Shell Bash

The shell is the operating surface of our HPC system.

By the end of this tiny tutorial you should be able to:

- know where you are
- find the file
- inspect the log
- confirm the environment
- stop retyping all commands

Request access  for the HPC and follow the local onboarding instructions

Now that  you are logged in.

You might ask yourself What is this thing?

The cluster uses **Bash**.

Don't trust me? Check:

```bash
echo $SHELL
```

You should see 

```bash
/bin/bash
```
You are dealing with Unix, which has:

- kernel -> does the real work
- shell -> translates your commands
- programs -> the tools you run

### What Actually Happens

If you run

```bash
rm myfile
```

You might think:

> You deleted a file

Reality:

- shell finds `rm`
- kernel executes it
- file disappears forever
- no emotions, no undo

### A few tips here and there 

Type part of a command and press `Tab`. If it:

- completes -> good
- does not complete -> be more specific

---

You can always see the history of the commands you ran, Try it

```bash
history
```

- up-arrow and down-arrow scroll through commands
- stop retyping everything

Always know your state i.e where you are and so on. Here are the commands that can help

```bash
pwd           # where you are
echo $PATH    # where commands come from
history       # what you did
!!            # rerun the last command
!204          # rerun command number 204 from your history
```


### Moving around

is easy 

```bash
pwd
ls -lah
cd /path/to/project
cd /                  # root, top of everything
cd -                  # go back to the previous directory
cd ..                 # go up one directory
df -h                 # check disk space
```

### Level Up Using Aliases

because sometimes the commands are too long or you use some commands relatively more than other 

look at this commands 

- `ll` -> useful listing
- `gs` -> git shortcut
- `py` -> python shortcut
- `rm -i` -> asks before deleting

During a session you can create their aliases like this:

```bash
alias ll='ls -lah'
alias gs='git status'
alias py='python3'
alias rm='rm -i'
```

Now typing `ll` runs `ls -lah`, and so on. Any command can be made into an alias.

Aliases created this way only last for the current shell session. When you close
the terminal, they are gone 

Save them in your shell config file to make the persistent.

Open the `.bashrc` file

```bash
nano ~/.bashrc
```

Add:

```bash
alias rm='rm -i'
alias ll='ls -lah'
alias gs='git status'
alias py='python3'
```

Apply changes:

```bash
source ~/.bashrc
```
---

You might want to 

### Stop deleting things like a villain

The default `rm`:

- deletes instantly
- no warning
- no recovery

Safer version would be if you add an alias

```bash
alias rm='rm -i'
```

Now you get:

> remove file? y/n


Document your work but if you misplace a file you can still

### Find your stuff before you panic

use a wildcard `*` to find all files with a particular extension. You can also target particular folders. For:

- recent files -> `-mtime -1`
- errors -> `grep`
- fast log read -> `tail`
- jump to end -> `less +G`

examples

```bash
find . -name "*.out"
find . -type f -mtime -1
grep -R "Traceback" logs/
grep -R "error\|fail\|killed" logs/
tail -n 100 slurm-12345.out
less +G logs/run.err
```

### Read the lost and found files

by using this common commands:
- `cat` -> small files
- `less` -> large logs
- `head` -> beginning
- `tail` -> end

examples:

```bash
cat config.yaml
less slurm-12345.out
head -n 20 run.sh
tail -n 40 slurm-12345.out
```

### Permissions and Environment Problems

check out the [environments section](./environments.md) for more information on that topic.

As for permissions 
they  are expressed as three sets:

```
[user][group][others]
```
we have digits like 700, 750 etc.
Each digit is a sum of:

* `4` = read (`r`)
* `2` = write (`w`)
* `1` = execute (`x`)

for example
| Mode  | Meaning                             |
| ----- | ----------------------------------- |
| `700` | Owner: rwx, Group: ---, Others: --- |
| `750` | Owner: rwx, Group: r-x, Others: --- |
| `755` | Owner: rwx, Group: r-x, Others: r-x |
| `644` | Owner: rw-, Group: r--, Others: r-- |


that you can interprete as follows.

`700`

* Only **you (owner)** can read/write/execute `rwx`
* Nobody else can even see inside
* Good for **private scripts or sensitive data**

`750`

* You: full access
* Group: read + execute
* Others: no access

`755`

* Everyone can execute
* Typical for public scripts and system binaries

If your script fails  you might be missing the execute permission

Check the script:

```bash
ls -l run.sh
```
If you see:

```
-rw-r--r-- run.sh
```

No `x` → cannot execute

Fix:

```bash
chmod +x run.sh
```
Directory permissions matter too but i think you will discover this on your own. 

Debug Strategy if you get an error 

```bash
ls -l run.sh        # permissions
which python        # actual interpreter
module list         # loaded modules
module purge        # clean environment
echo $PATH          # execution path
```



### Storage

You want to keep your configs at **home**. Create various folders for each **project** and use **scratch**  for temporary data. 

Check usage and limits

```bash
pwd              # where am I?
du -sh .         # size of current directory
du -sh *         # size per subdirectory (very useful)
df -h            # filesystem capacity
```

To move and transfer data i find it better to compress as it 
* reduces size
* avoids slow transfers due to many inodes/filesfirst 
```bash
tar -czf results.tar.gz results/
```
you can then extract this files 

```bash
tar -xzf results.tar.gz
```
I prefer  `rsync` to transfer my data. 

```bash
rsync -avh project/ backup/project/
```
Its 

* incremental 
* preserves permissions/timestamps
* resumable

 Add progress to the transfer 

```bash
rsync -avh --progress project/ backup/project/
```

and even remote sync if you wanna tranfer data from local laptop to HPC

```bash
rsync -avh project/ user@host:/path/project/
```
You can a;so use `scp` 

```bash
scp file.txt user@host:/path/
```

### If you still want more

You may consult this tutorial by Flavio Copes on freeCodeCamp:

- <https://www.freecodecamp.org/news/the-linux-commands-handbook/>

Or download his free book from:

- <https://flaviocopes.com/access/>

<div class="home-links">
  <a class="home-link-pill" href="./index.md">Home</a>
</div>
