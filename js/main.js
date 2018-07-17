const BFC = (parameters) => {
    const self = {};

    for (let key in parameters) {
        self[key] = parameters[key];
    }

    self.parent_select = '#' + self.parent_id;
    self.lines_n = 25;
    self.lines_height = 9;
    self.lines_padd = 6;
    self.page_width = 300;
    self.page_padd = 10;
    self.page_y = 35;
    self.page_height = self.lines_height * self.lines_n + self.lines_padd * (self.lines_n - 1) + 2 * self.page_padd;
    self.num_pages = 150;

    self.init = () => {
        self.svg = d3.select(self.parent_select)
            .append('svg')
            .attr('width', self.width)
            .attr('height', self.height)
            .style('background-color', '#eee');

        self.g_nav = self.svg.append('g')
            .attr("transform", "translate(" + 10 + ", " + (self.height - 50) + ")")
            .attr('width', self.width - 20)
            .attr('height', 30);

        self.g_page = self.svg.append('g')
            .attr("transform", "translate(" + (self.width / 2 - self.page_width / 2) + ", " + 0 + ")");
    }

    self.render = (data) => {
        /* Page Title */
        self.page_title = self.g_page.append('text')
            .attr('x', self.page_width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text('Página 1');

        // page
        self.g_page.append('rect')
            .attr('x', 0)
            .attr('y', self.page_y)
            .attr('width', self.page_width)
            .attr('height', self.page_height)
            .attr('fill', '#fff');

        const lines = self.g_page.append('g');

        // Page lines
        lines.selectAll('.line')
            .data(Array(self.lines_n))
            .enter()
            .append('rect')
            .attr('x', (d, i) => {
                const x = i % 10 == 0? 20 : 0;
                return x + self.page_padd;
            })
            .attr('y', (d, i) => {
                const page_offset = self.page_y + self.page_padd;
                const bar_height = self.lines_height + self.lines_padd;
                return page_offset + i * (bar_height);
            })
            .attr('width', (d, i) => {
                const x = i % 10 == 0? 20 : 0;
                return self.page_width - 2 * self.page_padd - x;
            })
            .attr('height', self.lines_height)
            .style('fill', '#eee');

        // Navigation bar
        self.renderNavbar(data);
    }

    self.renderNavbar = (data) => {
        const pages = {};
        const dots = [];
        const nav_width = self.width - 20;
        const nav_height = 30;
        const item_width = nav_width / self.num_pages;

        data.forEach(element => {
            if (pages[element['Página']] === undefined) {
                pages[element['Página']] = [];
            }
            pages[element['Página']].push(element);
        });

        for (const key in pages) {
            if (pages.hasOwnProperty(key)) {
                const page = pages[key];
                page.forEach((item, i) => {
                    dots.push({
                        page: parseInt(key),
                        data: item,
                        y: i
                    });
                })
            }
        }

        // Bar
        self.g_nav.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', nav_width)
            .attr('height', nav_height)
            .attr('fill', '#fff');

        // Dots
        const g_dots = self.g_nav.append('g');

        g_dots.selectAll('.dot')
            .data(dots)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', (d) => (d.page - 1) * item_width + item_width / 2)
            .attr('cy', (d) => 4 + d.y * 8)
            .attr('r', 3)
            .attr('fill', (d) => {
                let color = 'rgba(0, 128, 0, 0.25)';
                if (d.data.Problema == 'OK') {
                    color = 'rgba(0, 128, 0, 0.25)';
                } else {
                    color = 'red';
                }
                return color;
            });

        // Marker
        self.g_nav.append('rect')
            .attr('x', 0)
            .attr('y', -5)
            .attr('width', item_width)
            .attr('height', nav_height + 10)
            .attr('fill', 'transparent')
            .attr('stroke', 'rgba(0,0,0,0.75)')
            .attr('stroke-width', 3)
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        function dragstarted(d) {
            d3.select(this).raise().classed("active", true);
        }

        function dragged(d) {
            d3.select(this)
                .attr("x", () => {
                    let x = d3.event.x;

                    // Fit to boundary
                    x = x < 0 ? 0 : x;
                    x = x > nav_width - item_width ? nav_width - item_width : x;

                    const page = Math.ceil(x / item_width) + 1;
                    self.updatePage(page, pages[page]);
                    return (page - 1) * item_width;
                });
        }

        function dragended(d) {
            d3.select(this).classed("active", false);
        }

        self.updatePage(71, pages[71]);
    }

    self.updatePage = (p, data) => {
        self.page_title
            .text('Página ' + p);

        self.g_page.selectAll('.hl').remove();
        if (data == undefined) return;

        const hl_min = 100;

        // Page lines
        self.g_page.selectAll('.hl')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'hl')
            .attr('x', (d, i) => {
                const j = Math.floor(self.lines_n / data.length) * i;
                const x = j % 10 == 0? 20 : 0;
                d.x = Math.random() * (self.page_width - 2 * self.page_padd);
                d.x = Math.min(d.x, self.page_width - 2 * self.page_padd - hl_min);
                return self.page_padd + d.x + x;
            })
            .attr('y', (d, i) => {
                const j = Math.floor(self.lines_n / data.length) * i;
                const page_offset = self.page_y + self.page_padd;
                const bar_height = self.lines_height + self.lines_padd;
                return page_offset + j * (bar_height);
            })
            .attr('width', (d, i) => {
                const j = Math.floor(self.lines_n / data.length) * i;
                const x = j % 10 == 0? 20 : 0;
                let w = Math.random() * (self.page_width - 2 * self.page_padd - d.x);
                return Math.max(hl_min, w) - x;
            })
            .attr('height', self.lines_height)
            .attr('fill', (d) => {
                let color = 'rgba(0, 128, 0, 0.25)';
                if (d.Problema == 'OK') {
                    color = 'rgba(0, 128, 0, 0.25)';
                } else {
                    color = 'red';
                }
                return color;
            });

    }

    self.init();
    return self;
}

(async () => {
    const bfc = BFC({
        parent_id: 'root',
        width: 1000,
        height: 500,
    });

    const data = await d3.csv("data.csv");
    bfc.render(data);
})();