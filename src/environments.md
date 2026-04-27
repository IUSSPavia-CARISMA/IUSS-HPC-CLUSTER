# Environments

This page explains how to avoid poisoning your jobs with the wrong Python interpreter, the wrong package set, or incorrect runtime assumptions. The goal is to save you a significant amount of debugging time.

Environments allow you to configure a Python setup for a specific purpose without creating conflicts between packages or package versions required by other applications. Although Python is the most common example, the same principle applies to other languages and toolchains.

You might wonder why this matters. On real systems, especially HPC clusters, you often need the same package in different versions because of dependency constraints. Without isolated environments, these requirements collide and break workflows.

On a cluster, the phrase “it worked yesterday” usually means one of the following happened:

- you loaded a different module

- you activated a different environment

- your batch job did not inherit the environment from your interactive shell

- you forgot which interpreter the job was actually using

Environments solve these problems by making your runtime explicit, reproducible, and isolated.

Always confirm what you are running:

```bash
which python
python --version
module list
echo $PATH
```


The main tools are:

- Conda environments
- Python virtual environments
- containers


## Conda

To create an environment:

```bash
conda create -n myenv python=3.11
```
You will see something like 
```
Retrieving notices: done
Channels:
 - conda-forge
 - defaults
Platform: linux-64
Collecting package metadata (repodata.json): 
```

You will be prompted to accept package installations make sure to accept or deny as you may will. Let that finish

Activate it:

```bash
conda activate myenv
```
Check what packages you have installed 
```bash
conda list
```
Install even more beasty  packages:

```bash
conda install numpy pandas
pip install xarray
conda install -c conda-forge numpy scipy xarray
```
if you are bored with a packages remove it 

```bash
conda remove numpy
```
Deactivate

```bash
conda deactivate
```
You may end up in a situation where you have created several environments 

List and find your desired environment 
conda env list

```bash
conda env list
```
Then activate it and so on and so what 

If you wanna go even more geeky.You can Create an environment from an environment.yml file.

First things first <span style="color:red;">environment.yml</span>  file?

Simply put this is a text file  that describes:

- the environment name

- the channels to use

- the exact packages and versions

- optional pip packages

- optional variables

It is the most reproducible way you can think of as it saves the information and you can come back to it if you have removed your enewctionment and recreate the same environment today, tomorrow, and next year

This also allow same environment creation with your collaborators and supervisors etc. You get the idea

lets make the file 

```bash
nano environment.yaml
```
the you can type the information

```bash
name: myenv
channels:
  - conda-forge
  - defaults

dependencies:
  - python=3.10
  - numpy=1.26
  - pandas=2.1
  - xarray
  - matplotlib
  - pip
  - pip:
      - rasterio
      - geopandas
```

you can press CTRL+O enter. CTRL + X

Explanation:

**name:** → the environment name

**channels:** → where Conda should search for packages

**dependencies:** → Conda packages

**pip:** → pip-only packages

Once you have an environment.yml file:
```bash
ls 
environment.yaml
```
create the env
```bash
conda env create -f environment.yml
```
If the environment already exists and you want to update it
```bash
conda env update -f environment.yml --prune
```
You can recreate an environment from an existing environment
Its a common thing especially if you were testing your workflow on local pc and you want to scale it up.

```bash
conda activate myenv
conda env export > environment.yml
```
This captures:

- exact versions
- build numbers
- channels
- pip packages

The only downside is that the exported file often contains too much hashes, local paths and depedencies. Read the file and use your expert knowledge

> 🐥 **The Sweet Duck says:** " You can quench your thirst
[here](https://confluence.ecmwf.int/display/UDOC/Getting+started+with+Conda)



Remove it completely when you are done:

```bash
conda remove -n myenv --all
```

## Python Virtual Environments (venv)

I hear you say you said we can use python but why the hell you are not telling us more. And you are right. You can use a plain Python environment


`venv` is the built‑in Python tool for creating isolated environments.It is lightweight, fast, and ideal when:

- you want minimal overhead
- you only need Python packages (no external libraries)
- you want a reproducible environment tied to a specific Python version

Each environment contains:

- its own Python interpreter  
- its own `site-packages` directory  
- its own `pip` installation  

Create an environment in a directory

```bash
python3 -m venv .venv
```
This creates:

```
.venv/bin/      # Unix/MacOS executables
.venv/Scripts/  # Windows executables
.venv/lib/      # Python libraries
```

dont forget that you can start at your `cd` or give `pathto/home/user/project_env `

Activate

```bash
source .venv/bin/activate
```
 Deactivate
```bash
deactivate
```
Install packages
```bash
pip install numpy pandas
```
or a specific version
```bash
pip install requests==2.31.0
```
you can as well upgrade a package

```bash
pip install --upgrade requests
```
and  remove it 
```bash
pip uninstall requests
```
of course you want to list installed packages before anything 

```bash
pip list
```

display details of these packages
```bash
pip show numpy
```
before deciding as to whether you wanna install update and so on you get the idea :)

as we did above in the conda environments,
You can export and reproduce environments

save the list of installed packages to `requirements.txt`
```bash
pip freeze > requirements.txt
```

Then recreate environment from `requirements.txt`
```bash
pip install -r requirements.txt
```



I know that you can be bored of this environments so purge it by simply deleting the directory:

```bash
rm -rf .venv
```



 > 🐥 **The Sweet Duck says:** " remember to quench your thirst
[here](https://docs.python.org/3/tutorial/venv.html)

<div class="home-links">
  <a class="home-link-pill" href="./index.md">Home</a>
</div>

