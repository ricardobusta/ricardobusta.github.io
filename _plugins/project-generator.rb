module Jekyll
    class PrebuildGenerator < Generator
        safe true

        priority :lowest

        def generate(site)
            result = exec("python .\\prebuild.py")
        end
    end
end