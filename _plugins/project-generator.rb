module Jekyll
    class PrebuildGenerator < Generator
        safe true

        priority :lowest

        def generate(site)
            result = exec("python ./_python/legal/prebuild.py")
        end
    end
end