Julia ships with a package manager: Pkg.
It installs and organizes packages.

The goal of this tutorial is to cover basics concepts needed to use Pkg effectively.

# The Pkg REPL Interface

There are two ways to use Pkg: a REPL interface and a standard API.
To use the REPL interface, enter the right square bracket `]` in the Julia REPL.
You should see the Pkg prompt `pkg>` replace the Julia prompt `julia>`.

Start the Julia REPL and switch to the Pkg REPL:

```
[david@blue ~] $ julia
julia> 1 + 1
2

(@v1.6) pkg>
```

# Installing and Loading a Package

You can see available packages with `status`:

```
(@v1.6) pkg> status
      Status `~/.julia/environments/v1.6/Project.toml` (empty project)
```

You should see similar feedback on a fresh system.
"empty project" means no packages are available for use.
  
To install a package, use `add`.
Install the JSON package:

```
(@v1.6) pkg> add JSON
```

You should see feedback as Pkg installs the package.
Use `status` to confirm the operation was successful:

```
(@v1.6) pkg> status
      Status `~/.julia/environments/v1.6/Project.toml`
  [682c06a0] JSON v0.21.1
```

The feedback shows JSON is available.
To use the package, return to the Julia REPL by pressing the `BACKSPACE` key.
You can now load JSON with `import` and begin using it:
  
```
julia> import JSON

julia> JSON.parse("""{"a_number" : 5.0, "an_array" : ["foo", 9]}""")
Dict{String, Any} with 2 entries:
  "an_array" => Any["foo", 9]
  "a_number" => 5.0
```

If you need to use a package:
1. `add` will make a package available
2. `import` will load the package in your current session
  
# Basic commands

Let's try a few more commands.
Recall our example project already declares JSON as a dependency.

You can print the set of declared dependencies with `status`:
```
(@v1.6) pkg> status
      Status `~/.julia/environments/v1.6/Project.toml`
  [682c06a0] JSON v0.21.1
```

To declare more dependencies use `add` again:
```
(@v1.6) pkg> add DataStructures
```

Both `JSON` and `DataStructures` are now declared as dependencies:
```
(@v1.6) pkg> status
      Status `~/.julia/environments/v1.6/Project.toml`
  [864edb3b] DataStructures v0.18.9
  [682c06a0] JSON v0.21.1
```

To remove a declaration, use `rm`:
```
(@v1.6) pkg> rm JSON
```

```
(@v1.6) pkg> status
      Status `~/.julia/environments/v1.6/Project.toml`
  [864edb3b] DataStructures v0.18.9
```

`rm` will *not* uninstall a package from your system.
Instead, it will update the declarations to reflect that you no longer require that package.
Because of this property, Pkg commands tend to be fast: they usually only manipulate the declarations.

You now know how to add, remove, and print dependency declarations.

# Projects

So far, I've referred to a **set of dependency declarations** in the abstract sense.
Pkg organizes sets of dependency declarations into organizational units called projects.

Traditional package managers organize everything into the conceptual equivalent
    of a single project.
While this approach is initially simpler, it invariably leads to the dreaded
    [dependency hell](https://en.wikipedia.org/wiki/Dependency_hell).
Pkg projects provide a way to handle such issues while also enabling
    powerful features such as reproducible projects.

# Project Files

Projects are encoded in your file system as a directory containing a project file.
A project file is a [TOML formatted](https://github.com/toml-lang/toml/blob/master/README.md) file
    that will either have the name `Project.toml` or `JuliaProject.toml`.

Let's look at the current project file:
```
[deps]
DataStructures = "864edb3b-99cc-5e75-8d2d-829cb0a9cfe8"
```

The `deps` table lists all the direct dependencies for a project.
It is a map from the name of a dependency to a UUID.
The name corresponds to the name you will use to load and access the dependency
    from within a Julia session.
The UUID is used within Pkg and the code loading mechanism to reference dependencies.

# Switching Projects

Pkg commands always target the active project.
You can set the active project by directing `activate` to a filesystem directory:

```
(jl_o9x6aA) pkg> activate ./Foo
  Activating new environment at `~/Foo/Project.toml`

(Foo) pkg> status
      Status `~/Foo/Project.toml` (empty project)
```

The feedback tells you that this new project will be stored at the directory `~/Foo`.
The Pkg REPL prompt will update to reflect the active project.
We can also tell that we are targeting a new project because status tells us
    that the project is empty.

Pkg also supports temporary projects.
They are useful when you want to create a project on the fly.
You can create a temporary project with the `--temp` flag:

```
(Foo) pkg> activate --temp
  Activating new environment at `/tmp/jl_o9x6aA/Project.toml`

(jl_o9x6aA) pkg> 
```

Remember, thanks to intelligent caching, projects are extremely cheap to create.
Use new projects as often as necessary.

# Packages

At some point, you will want to make your code available to others.
You can do this by creating a Pkg package.
Recall that a project is the set of requirements needed for a piece of code to run.
Then, a package is really just a specific kind of project.
In addition to a normal project, a package also requires:

1. a root module
2. a name
3. a uuid

Pkg requires the name of the package and the name of the root module to be the same.
Additionally, it requires the root module to be stored at `src/<PACKAGE_NAME>.jl`
    relative to the package's root directory.

# Creating a new package

Let's walk through creating a new package.
There exist a variety of packages to help with this, but I like using PkgSkeleton.

First, create a temporary project so that we can install PkgSkeleton:

```
(@v1.6) pkg> activate --temp
  Activating new environment at `/tmp/jl_XgtyFv/Project.toml`
```

Next, install and load PkgSkeleton:

```
(jl_XgtyFv) pkg> add PkgSkeleton
<feedback omitted>

julia> import PkgSkeleton
```

Use `generate` to create the package:

```
julia> PkgSkeleton.generate("ExamplePackage")
<feedback omitted>
```

PkgSkeleton will create a directory where the package is stored.
You will see that all the basic requirements for a package are satisfied:

- a project file in the root of the directory
- the project file specifies a name, a UUID, and a `deps` table
- a root module stored at `src/ExamplePackage.jl`

Notice the root module is initially empty.
Let's modify it so that our new package has some functionality:

```
module ExamplePackage

hello() = println("Hello World!")

end # module
```

Finally, load and use the package:

```
(jl_XgtyFv) pkg> activate ./ExamplePackage/
  Activating project at `~/ExamplePackage`

julia> import ExamplePackage
[ Info: Precompiling ExamplePackage [708cade6-8b63-4e43-a962-7a27faa63a21]

julia> ExamplePackage.hello()
Hello World!
```

# Pkg Help and Further Reading

The Pkg REPL also ships with a built-in help system.

Try asking it about the add command:
```
(@v1.6) pkg> ? add
```

Or ask for a synopsis of all commands:
```
(@v1.6) pkg> ?
```

You can also check out the [Pkg reference documentation](https://pkgdocs.julialang.org/v1.6/)
    for more details.
If you get stuck you can usually find someone to help you on 
    [Julia's Discourse](https://discourse.julialang.org/)
    or on [StackOverflow](https://stackoverflow.com/questions/tagged/julia) using the `julia` tag.
Happy packaging!
