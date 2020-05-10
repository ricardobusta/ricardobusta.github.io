module Jekyll
    class LegalPageGenerator < Generator
        safe true

        priority :lowest

        def generate(site)
            all_projects = site.site_payload['site']['projects'].select { |project| project['bundle_id'] }
            all_projects.each do |project|
                Jekyll.logger.debug project['title']
                site.pages << PrivacyPolicyPage.new(site, project)
                site.pages << TermsAndConditionsPage.new(site, project)
            end
        end
    end

    class LegalPage < Page
        def initialize(site, project)
            @site = site
            @base = site.source
            @dir  = site.config[self.path_key] + project['bundle_id']
            @name = 'index.html'

            self.process(@name)
            self.read_yaml(File.join(@base, '_layouts'), site.config[self.layout_key()]+".html")

            self.data['title'] = project['title']
            self.data['app_name'] = project['title']

            self.data['company_name'] = site.config['company_name']
            self.data['contact'] = site.config['contact']          

            self.fill_data(project)
        end

        ERROR = "Method not implemented"
        def path_key; raise ERROR; end
        def layout_key; raise ERROR; end
        def fill_data; raise ERROR; end
    end

    class PrivacyPolicyPage < LegalPage
        def path_key()
            return 'pp_path'
        end

        def layout_key()
            return 'pp_layout'
        end

        def fill_data(project)
            self.data['license_type'] = project['license_type']
            self.data['user_information'] = project['user_information']    
        end
    end
    
    class TermsAndConditionsPage < LegalPage
        def path_key()
            return 'tac_path'
        end

        def layout_key()
            return 'tac_layout'
        end

        def fill_data(project)  
        end
    end
end